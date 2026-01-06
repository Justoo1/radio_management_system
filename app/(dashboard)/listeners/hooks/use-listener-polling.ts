'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

interface UseListenerPollingOptions {
  statsInterval?: number;
  requestsInterval?: number;
  sessionsInterval?: number;
  enabled?: boolean;
}

export function useListenerPolling(
  organizationId: string,
  options: UseListenerPollingOptions = {}
) {
  const {
    statsInterval = 10000, // 10 seconds
    requestsInterval = 5000, // 5 seconds
    sessionsInterval = 8000, // 8 seconds
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<ListenerStats | null>(null);
  const [requests, setRequests] = useState<ListenerRequest[]>([]);
  const [sessions, setSessions] = useState<ListenerSession[]>([]);
  const [loading, setLoading] = useState(true);

  const statsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/listener/stats', {
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setIsConnected(true);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching listener stats:', error);
      }
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/requests', {
        headers: {
          'x-organization-id': organizationId,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || data || []);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching listener requests:', error);
      }
    }
  }, [organizationId]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/listener/sessions?limit=20', {
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data || []);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching listener sessions:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!enabled || !organizationId) return;

    const initialFetch = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRequests(), fetchSessions()]);
      setLoading(false);
    };

    initialFetch();
  }, [enabled, organizationId, fetchStats, fetchRequests, fetchSessions]);

  // Stats polling
  useEffect(() => {
    if (!enabled || !organizationId) return;

    const poll = () => {
      fetchStats();
      statsTimeoutRef.current = setTimeout(poll, statsInterval);
    };

    statsTimeoutRef.current = setTimeout(poll, statsInterval);

    return () => {
      if (statsTimeoutRef.current) {
        clearTimeout(statsTimeoutRef.current);
      }
    };
  }, [enabled, organizationId, statsInterval, fetchStats]);

  // Requests polling
  useEffect(() => {
    if (!enabled || !organizationId) return;

    const poll = () => {
      fetchRequests();
      requestsTimeoutRef.current = setTimeout(poll, requestsInterval);
    };

    requestsTimeoutRef.current = setTimeout(poll, requestsInterval);

    return () => {
      if (requestsTimeoutRef.current) {
        clearTimeout(requestsTimeoutRef.current);
      }
    };
  }, [enabled, organizationId, requestsInterval, fetchRequests]);

  // Sessions polling
  useEffect(() => {
    if (!enabled || !organizationId) return;

    const poll = () => {
      fetchSessions();
      sessionsTimeoutRef.current = setTimeout(poll, sessionsInterval);
    };

    sessionsTimeoutRef.current = setTimeout(poll, sessionsInterval);

    return () => {
      if (sessionsTimeoutRef.current) {
        clearTimeout(sessionsTimeoutRef.current);
      }
    };
  }, [enabled, organizationId, sessionsInterval, fetchSessions]);

  const refetchStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const refetchRequests = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  const refetchSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  return {
    isConnected,
    loading,
    stats,
    requests,
    sessions,
    refetchStats,
    refetchRequests,
    refetchSessions,
  };
}
