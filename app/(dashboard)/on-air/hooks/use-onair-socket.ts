'use client';

import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket/client';
import { Socket } from 'socket.io-client';

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

export function useOnAirSocket(organizationId: string, userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [requests, setRequests] = useState<ListenerRequestData[]>([]);

  // Fetch current now playing data and queue on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch current now playing
        const nowResponse = await fetch('/api/onair/now');
        if (nowResponse.ok) {
          const data = await nowResponse.json();
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
          }
        }

        // Fetch queue
        const queueResponse = await fetch('/api/onair/queue');
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          if (Array.isArray(queueData)) {
            setQueue(queueData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    // Don't connect if organizationId is empty
    if (!organizationId) {
      setIsConnected(false);
      return;
    }

    const sock = connectSocket(organizationId, userId);
    setSocket(sock);

    sock.on('connect', () => {
      setIsConnected(true);
      // Join dashboard room
      sock.emit('join:dashboard', { organizationId });

      // Fetch latest queue and now playing when joining
      const fetchLatestData = async () => {
        try {
          const queueResponse = await fetch('/api/onair/queue');
          if (queueResponse.ok) {
            const queueData = await queueResponse.json();
            if (Array.isArray(queueData)) {
              setQueue(queueData);
            }
          }

          // Also fetch latest now playing to ensure correct timestamps
          const nowResponse = await fetch('/api/onair/now');
          if (nowResponse.ok) {
            const nowData = await nowResponse.json();
            if (nowData?.id) {
              const formattedData: NowPlayingData = {
                id: nowData.id,
                title: nowData.title || 'Unknown',
                artist: nowData.artist,
                duration: Number(nowData.duration) || 0,
                remainingSeconds: Number(nowData.remainingSeconds) || Number(nowData.duration) || 0,
                startedAt: nowData.startedAt,
                endsAt: nowData.endsAt,
                thumbnailUrl: nowData.thumbnailUrl,
                itemType: nowData.itemType || 'PROGRAM',
              };
              setNowPlaying(formattedData);
            }
          }
        } catch (error) {
          console.error('Failed to fetch latest data:', error);
        }
      };
      fetchLatestData();
    });

    sock.on('disconnect', () => {
      setIsConnected(false);
    });

    // Now Playing updates - ensure proper data formatting
    sock.on('now-playing:update', (data: any) => {
      const formattedData: NowPlayingData = {
        id: data.id || '',
        title: data.title || 'Unknown',
        artist: data.artist,
        duration: Number(data.duration) || 0,
        remainingSeconds: Number(data.remainingSeconds) || Number(data.duration) || 0,
        startedAt: data.startedAt ? String(data.startedAt) : new Date().toISOString(),
        endsAt: data.endsAt ? String(data.endsAt) : new Date(Date.now() + (Number(data.duration) || 0) * 1000).toISOString(),
        thumbnailUrl: data.thumbnailUrl,
        itemType: data.itemType || 'PROGRAM',
      };
      setNowPlaying(formattedData);
    });

    sock.on('song:skipped', () => {
      setNowPlaying(null);
    });

    // Queue updates
    sock.on('queue:updated', (data: { queue?: QueueItem[] } | QueueItem[]) => {
      if (Array.isArray(data)) {
        setQueue(data);
      } else if (data.queue) {
        setQueue(data.queue);
      }
    });

    // Timer updates
    sock.on('timer:tick', (data: { remainingSeconds: number }) => {
      setNowPlaying((prev) =>
        prev ? { ...prev, remainingSeconds: data.remainingSeconds } : null
      );
    });

    // Listener requests
    sock.on('request:new', (data: ListenerRequestData) => {
      setRequests((prev) => [data, ...prev]);
    });

    sock.on('request:approved', (data: { id: string }) => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === data.id ? { ...req, status: 'APPROVED' } : req
        )
      );
    });

    sock.on('request:rejected', (data: { id: string }) => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === data.id ? { ...req, status: 'REJECTED' } : req
        )
      );
    });

    return () => {
      disconnectSocket();
    };
  }, [organizationId, userId]);

  // Actions
  const playSong = (song: Partial<QueueItem>) => {
    socket?.emit('song:play', song);
  };

  const skipSong = () => {
    socket?.emit('song:skip', {});
  };

  const updateQueue = (items: QueueItem[]) => {
    socket?.emit('queue:update', { queue: items });
  };

  const playInstant = (audioId: string) => {
    socket?.emit('instant:play', { audioId });
  };

  const approveRequest = (requestId: string) => {
    socket?.emit('request:approve', { id: requestId });
  };

  const rejectRequest = (requestId: string) => {
    socket?.emit('request:reject', { id: requestId });
  };

  // Manual refetch functions as fallback when Socket.IO isn't working
  const refetchQueue = async () => {
    try {
      const response = await fetch('/api/onair/queue');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setQueue(data);
        }
      }
    } catch (error) {
      console.error('Error refetching queue:', error);
    }
  };

  const refetchNowPlaying = async () => {
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
      console.error('Error refetching now playing:', error);
    }
  };

  const refetchRequests = async () => {
    try {
      const response = await fetch('/api/onair/requests');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setRequests(data);
        }
      }
    } catch (error) {
      console.error('Error refetching requests:', error);
    }
  };

  return {
    socket,
    isConnected,
    nowPlaying,
    queue,
    requests,
    playSong,
    skipSong,
    updateQueue,
    playInstant,
    approveRequest,
    rejectRequest,
    refetchQueue,
    refetchNowPlaying,
    refetchRequests,
  };
}
