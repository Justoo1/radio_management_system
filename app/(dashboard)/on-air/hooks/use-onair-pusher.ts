'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from '@/lib/pusher/client';
import type { Channel } from 'pusher-js';

export interface NowPlayingData {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  remainingSeconds: number;
  startedAt: string;
  endsAt: string;
  thumbnailUrl?: string;
  itemType: string;
  programId?: string;
}

export interface QueueItem {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  position: number;
  thumbnailUrl?: string;
  itemType: string;
  audioUrl?: string;
  programId?: string;
}

export interface ListenerRequestData {
  id: string;
  listenerName?: string;
  listenerPhone: string;
  requestType: string;
  songTitle?: string;
  songArtist?: string;
  message?: string;
  source: string;
  status: string;
  createdAt: string;
}

export function useOnAirPusher(organizationId: string, userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [requests, setRequests] = useState<ListenerRequestData[]>([]);

  const channelRef = useRef<Channel | null>(null);
  const requestChannelRef = useRef<Channel | null>(null);

  // Fetch initial data
  const fetchNowPlaying = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/now', {
        headers: { 'x-organization-id': organizationId },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.id) {
          setNowPlaying({
            id: data.id,
            title: data.title || 'Unknown',
            artist: data.artist,
            duration: Number(data.duration) || 0,
            remainingSeconds: Number(data.remainingSeconds) || Number(data.duration) || 0,
            startedAt: data.startedAt,
            endsAt: data.endsAt,
            thumbnailUrl: data.thumbnailUrl,
            itemType: data.itemType || 'PROGRAM',
            programId: data.programId,
          });
        } else {
          setNowPlaying(null);
        }
      }
    } catch (error) {
      console.error('[OnAir Pusher] Error fetching now playing:', error);
    }
  }, [organizationId]);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/queue', {
        headers: { 'x-organization-id': organizationId },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      }
    } catch (error) {
      console.error('[OnAir Pusher] Error fetching queue:', error);
    }
  }, [organizationId]);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/requests', {
        headers: { 'x-organization-id': organizationId },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      }
    } catch (error) {
      console.error('[OnAir Pusher] Error fetching requests:', error);
    }
  }, [organizationId]);

  // Update remaining time every second
  useEffect(() => {
    if (!nowPlaying) return;

    const interval = setInterval(() => {
      setNowPlaying((prev) => {
        if (!prev) return null;
        const newRemaining = Math.max(0, prev.remainingSeconds - 1);
        return { ...prev, remainingSeconds: newRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nowPlaying?.id]); // Only reset when nowPlaying changes

  // Setup Pusher subscriptions
  useEffect(() => {
    if (!organizationId) {
      setIsConnected(false);
      return;
    }

    const pusher = getPusherClient();

    // Fetch initial data
    fetchNowPlaying();
    fetchQueue();
    fetchRequests();

    if (!pusher) {
      console.warn('[OnAir Pusher] Pusher not available, using fallback polling');
      setIsConnected(true);

      // Fallback to polling if Pusher is not available
      const pollInterval = setInterval(() => {
        fetchNowPlaying();
        fetchQueue();
        fetchRequests();
      }, 5000);

      return () => clearInterval(pollInterval);
    }

    // Subscribe to on-air channel
    const onairChannel = pusher.subscribe(PUSHER_CHANNELS.onair(organizationId));
    channelRef.current = onairChannel;

    // Subscribe to requests channel
    const requestChannel = pusher.subscribe(PUSHER_CHANNELS.requests(organizationId));
    requestChannelRef.current = requestChannel;

    // Connection state
    pusher.connection.bind('connected', () => {
      console.log('[OnAir Pusher] Connected');
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[OnAir Pusher] Disconnected');
      setIsConnected(false);
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('[OnAir Pusher] Connection error:', err);
      setIsConnected(false);
    });

    // Set initial connected state
    setIsConnected(pusher.connection.state === 'connected');

    // On-air event handlers
    onairChannel.bind(PUSHER_EVENTS.NOW_PLAYING_UPDATED, (data: NowPlayingData) => {
      console.log('[OnAir Pusher] Now playing updated:', data);
      setNowPlaying(data);
    });

    onairChannel.bind(PUSHER_EVENTS.NOW_PLAYING_ENDED, () => {
      console.log('[OnAir Pusher] Now playing ended');
      setNowPlaying(null);
    });

    onairChannel.bind(PUSHER_EVENTS.QUEUE_UPDATED, (data: QueueItem[]) => {
      console.log('[OnAir Pusher] Queue updated:', data);
      setQueue(data);
    });

    onairChannel.bind(PUSHER_EVENTS.QUEUE_ITEM_ADDED, (data: QueueItem) => {
      console.log('[OnAir Pusher] Queue item added:', data);
      setQueue((prev) => [...prev, data].sort((a, b) => a.position - b.position));
    });

    onairChannel.bind(PUSHER_EVENTS.QUEUE_ITEM_REMOVED, (data: { id: string }) => {
      console.log('[OnAir Pusher] Queue item removed:', data);
      setQueue((prev) => prev.filter((item) => item.id !== data.id));
    });

    onairChannel.bind(PUSHER_EVENTS.QUEUE_REORDERED, (data: QueueItem[]) => {
      console.log('[OnAir Pusher] Queue reordered:', data);
      setQueue(data);
    });

    onairChannel.bind(PUSHER_EVENTS.PROGRAM_STARTED, (data: NowPlayingData) => {
      console.log('[OnAir Pusher] Program started:', data);
      setNowPlaying(data);
    });

    onairChannel.bind(PUSHER_EVENTS.PROGRAM_ENDED, () => {
      console.log('[OnAir Pusher] Program ended');
      setNowPlaying(null);
    });

    // Request event handlers
    requestChannel.bind(PUSHER_EVENTS.REQUEST_NEW, (data: ListenerRequestData) => {
      console.log('[OnAir Pusher] New request:', data);
      setRequests((prev) => [data, ...prev].slice(0, 50));
    });

    requestChannel.bind(PUSHER_EVENTS.REQUEST_APPROVED, (data: { requestId: string }) => {
      console.log('[OnAir Pusher] Request approved:', data);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === data.requestId ? { ...req, status: 'APPROVED' } : req
        )
      );
    });

    requestChannel.bind(PUSHER_EVENTS.REQUEST_REJECTED, (data: { requestId: string }) => {
      console.log('[OnAir Pusher] Request rejected:', data);
      setRequests((prev) =>
        prev.map((req) =>
          req.id === data.requestId ? { ...req, status: 'REJECTED' } : req
        )
      );
    });

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(PUSHER_CHANNELS.onair(organizationId));
      }
      if (requestChannelRef.current) {
        requestChannelRef.current.unbind_all();
        pusher.unsubscribe(PUSHER_CHANNELS.requests(organizationId));
      }
    };
  }, [organizationId, fetchNowPlaying, fetchQueue, fetchRequests]);

  return {
    isConnected,
    nowPlaying,
    queue,
    requests,
    refetchNowPlaying: fetchNowPlaying,
    refetchQueue: fetchQueue,
    refetchRequests: fetchRequests,
  };
}
