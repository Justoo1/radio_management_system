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
  const [isConnected, setIsConnected] = useState(true); // Always "connected" with polling
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [requests, setRequests] = useState<ListenerRequestData[]>([]);

  const pollingIntervalsRef = useRef<{
    nowPlaying?: NodeJS.Timeout;
    queue?: NodeJS.Timeout;
    requests?: NodeJS.Timeout;
    timer?: NodeJS.Timeout;
  }>({});

  // Fetch now playing data
  const fetchNowPlaying = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/now');
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
      }
    } catch (error) {
      console.error('Error fetching now playing:', error);
    }
  }, []);

  // Fetch queue data
  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/queue');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, []);

  // Fetch requests data
  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/onair/requests');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  }, []);

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

    // Setup polling intervals
    // Poll now playing every 3 seconds
    pollingIntervalsRef.current.nowPlaying = setInterval(fetchNowPlaying, 3000);

    // Poll queue every 2 seconds
    pollingIntervalsRef.current.queue = setInterval(fetchQueue, 2000);

    // Poll requests every 4 seconds
    pollingIntervalsRef.current.requests = setInterval(fetchRequests, 4000);

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
