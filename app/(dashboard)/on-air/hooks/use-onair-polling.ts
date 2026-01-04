'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

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

export function useOnAirPolling(organizationId: string, userId: string) {
  const [isConnected, setIsConnected] = useState(true);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [requests, setRequests] = useState<ListenerRequestData[]>([]);

  const pollingIntervalsRef = useRef<{
    nowPlaying?: NodeJS.Timeout;
    queue?: NodeJS.Timeout;
    requests?: NodeJS.Timeout;
    timer?: NodeJS.Timeout;
  }>({});

  // Fetch now playing data with timeout
  const fetchNowPlaying = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/onair/now', {
        headers: {
          'x-organization-id': organizationId,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data?.id) {
          const formattedData: NowPlayingData = {
            id: data.id,
            title: data.title || 'Unknown',
            artist: data.artist,
            duration: Number(data.duration) || 0,
            remainingSeconds: Number(data.remainingSeconds) || Number(data.duration) || 0,
            startedAt: data.startedAt,
            endsAt: data.endsAt,
            thumbnailUrl: data.thumbnailUrl,
            itemType: data.itemType || 'PROGRAM',
          };
          setNowPlaying(formattedData);
        } else {
          setNowPlaying(null);
        }
      } else if (response.status === 504) {
        console.warn('[OnAir Poll] Server timeout, keeping last known state');
        // Don't clear nowPlaying on timeout, keep showing last known state
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('[OnAir Poll] Request timeout');
      } else {
        console.error('[OnAir Poll] Error fetching now playing:', error);
      }
      // Keep showing last known state on error
    }
  }, [organizationId]);

  // Fetch queue data with timeout
  const fetchQueue = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/onair/queue', {
        headers: {
          'x-organization-id': organizationId,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      } else if (response.status === 504) {
        console.warn('[OnAir Poll] Queue timeout, keeping last known state');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[OnAir Poll] Error fetching queue:', error);
      }
    }
  }, [organizationId]);

  // Fetch requests data with timeout
  const fetchRequests = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/onair/requests', {
        headers: {
          'x-organization-id': organizationId,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      } else if (response.status === 504) {
        console.warn('[OnAir Poll] Requests timeout, keeping last known state');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[OnAir Poll] Error fetching requests:', error);
      }
    }
  }, [organizationId]);

  // Update remaining time every second when something is playing
  useEffect(() => {
    if (!nowPlaying) return;

    const interval = setInterval(() => {
      setNowPlaying((prev) => {
        if (!prev) return null;
        const newRemaining = Math.max(0, prev.remainingSeconds - 1);
        return { ...prev, remainingSeconds: newRemaining };
      });
    }, 1000);

    pollingIntervalsRef.current.timer = interval;
    return () => clearInterval(interval);
  }, [nowPlaying]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!organizationId) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    // Fetch initial data
    fetchNowPlaying();
    fetchQueue();
    fetchRequests();

    // Setup polling intervals - Increased intervals to reduce server load
    // Poll now playing every 5 seconds (reduced from 3s)
    pollingIntervalsRef.current.nowPlaying = setInterval(fetchNowPlaying, 5000);

    // Poll queue every 4 seconds (reduced from 2s)
    pollingIntervalsRef.current.queue = setInterval(fetchQueue, 4000);

    // Poll requests every 6 seconds (reduced from 4s)
    pollingIntervalsRef.current.requests = setInterval(fetchRequests, 6000);

    return () => {
      // Cleanup all intervals
      Object.values(pollingIntervalsRef.current).forEach((interval) => {
        if (interval) clearInterval(interval);
      });
      pollingIntervalsRef.current = {};
    };
  }, [organizationId, fetchNowPlaying, fetchQueue, fetchRequests]);

  // Manual refetch functions
  const refetchNowPlaying = useCallback(async () => {
    await fetchNowPlaying();
  }, [fetchNowPlaying]);

  const refetchQueue = useCallback(async () => {
    await fetchQueue();
  }, [fetchQueue]);

  const refetchRequests = useCallback(async () => {
    await fetchRequests();
  }, [fetchRequests]);

  return {
    isConnected,
    nowPlaying,
    queue,
    requests,
    refetchNowPlaying,
    refetchQueue,
    refetchRequests,
  };
}
