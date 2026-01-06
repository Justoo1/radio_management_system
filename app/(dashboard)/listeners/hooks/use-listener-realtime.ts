'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher/client';
import type { Channel } from 'pusher-js';

export interface ListenerStats {
  totalSessions: number;
  activeSessions: number;
  avgDurationMinutes: number;
  totalRequests: number;
  topLocations: Array<{ country: string; count: number }>;
  recentSessions: Array<{
    id: string;
    ipAddress: string;
    country?: string;
    city?: string;
    startedAt: string;
    durationSeconds: number;
  }>;
}

export interface ListenerRequest {
  id: string;
  listenerName?: string;
  listenerPhone?: string;
  listenerEmail?: string;
  requestType: string;
  songTitle?: string;
  songArtist?: string;
  message?: string;
  status: string;
  source: string;
  createdAt: string;
}

export interface ListenerSession {
  id: string;
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  programId?: string;
  programName?: string;
}

interface UseListenerRealtimeOptions {
  pollFallbackInterval?: number; // Fallback polling interval if Pusher unavailable
  enabled?: boolean;
}

export function useListenerRealtime(
  organizationId: string,
  options: UseListenerRealtimeOptions = {}
) {
  const { pollFallbackInterval = 10000, enabled = true } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isPusherAvailable, setIsPusherAvailable] = useState(false);
  const [stats, setStats] = useState<ListenerStats | null>(null);
  const [requests, setRequests] = useState<ListenerRequest[]>([]);
  const [sessions, setSessions] = useState<ListenerSession[]>([]);
  const [loading, setLoading] = useState(true);

  const channelRef = useRef<Channel | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/listener/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching listener stats:', error);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/requests', {
        headers: { 'x-organization-id': organizationId },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching listener requests:', error);
    }
  }, [organizationId]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/listener/sessions?limit=20');
      if (response.ok) {
        const data = await response.json();
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error fetching listener sessions:', error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchStats(), fetchRequests(), fetchSessions()]);
    setLoading(false);
  }, [fetchStats, fetchRequests, fetchSessions]);

  // Setup Pusher subscription
  useEffect(() => {
    if (!enabled || !organizationId) return;

    const pusher = getPusherClient();

    if (!pusher) {
      // Pusher not available, fall back to polling
      setIsPusherAvailable(false);
      setIsConnected(true); // Consider "connected" via polling
      return;
    }

    setIsPusherAvailable(true);

    // Subscribe to listeners channel
    const channelName = PUSHER_CHANNELS.listeners(organizationId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    // Connection events
    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      console.log('[Pusher] Subscribed to', channelName);
    });

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[Pusher] Subscription error:', error);
      setIsConnected(false);
      setIsPusherAvailable(false);
    });

    // Listen for real-time events
    channel.bind(PUSHER_EVENTS.SESSION_STARTED, (data: any) => {
      console.log('[Pusher] Session started:', data);
      // Add new session to the list
      setSessions((prev) => [data.session, ...prev].slice(0, 20));
      // Refresh stats
      fetchStats();
    });

    channel.bind(PUSHER_EVENTS.SESSION_ENDED, (data: any) => {
      console.log('[Pusher] Session ended:', data);
      // Update session in list
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === data.sessionId
            ? { ...s, endedAt: data.endedAt, durationSeconds: data.durationSeconds }
            : s
        )
      );
      // Refresh stats
      fetchStats();
    });

    channel.bind(PUSHER_EVENTS.STATS_UPDATED, (data: any) => {
      console.log('[Pusher] Stats updated:', data);
      if (data.stats) {
        setStats(data.stats);
      } else {
        fetchStats();
      }
    });

    // Also subscribe to requests channel
    const requestsChannelName = PUSHER_CHANNELS.requests(organizationId);
    const requestsChannel = pusher.subscribe(requestsChannelName);

    requestsChannel.bind(PUSHER_EVENTS.REQUEST_NEW, (data: any) => {
      console.log('[Pusher] New request:', data);
      setRequests((prev) => [data.request, ...prev]);
    });

    requestsChannel.bind(PUSHER_EVENTS.REQUEST_APPROVED, (data: any) => {
      console.log('[Pusher] Request approved:', data);
      setRequests((prev) =>
        prev.map((r) => (r.id === data.requestId ? { ...r, status: 'APPROVED' } : r))
      );
    });

    requestsChannel.bind(PUSHER_EVENTS.REQUEST_REJECTED, (data: any) => {
      console.log('[Pusher] Request rejected:', data);
      setRequests((prev) =>
        prev.map((r) => (r.id === data.requestId ? { ...r, status: 'REJECTED' } : r))
      );
    });

    // Cleanup
    return () => {
      channel.unbind_all();
      requestsChannel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.unsubscribe(requestsChannelName);
      channelRef.current = null;
    };
  }, [enabled, organizationId, fetchStats]);

  // Initial data fetch
  useEffect(() => {
    if (!enabled || !organizationId) return;
    fetchAll();
  }, [enabled, organizationId, fetchAll]);

  // Fallback polling when Pusher is not available
  useEffect(() => {
    if (!enabled || !organizationId || isPusherAvailable) return;

    // Start polling
    const poll = () => {
      fetchAll();
    };

    pollIntervalRef.current = setInterval(poll, pollFallbackInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, organizationId, isPusherAvailable, pollFallbackInterval, fetchAll]);

  return {
    isConnected,
    isPusherAvailable,
    loading,
    stats,
    requests,
    sessions,
    refetchStats: fetchStats,
    refetchRequests: fetchRequests,
    refetchSessions: fetchSessions,
    refetchAll: fetchAll,
  };
}
