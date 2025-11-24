'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useOnAirSocket } from './hooks/use-onair-socket';
import { NowPlayingCard } from './components/now-playing-card';
import { QueueList } from './components/queue-list';
import { LiveRequestsFeed } from './components/live-requests-feed';
import { TodaysSchedule } from './components/todays-schedule';
import { toast } from 'sonner';

export default function OnAirDashboard() {
  const { data: session } = useSession();
  const [showSchedule, setShowSchedule] = useState(false);

  const {
    isConnected,
    nowPlaying,
    queue,
    requests,
    skipSong,
    updateQueue,
    approveRequest,
    rejectRequest,
    refetchQueue,
    refetchNowPlaying,
    refetchRequests,
  } = useOnAirSocket(
    (session?.user as any)?.organizationId || '',
    (session?.user as any)?.id || ''
  );

  // Fetch initial data
  useEffect(() => {
    if (session?.user) {
      fetchInitialData();
    }
  }, [session]);

  const fetchInitialData = async () => {
    try {
      // Fetch current playing
      const nowResponse = await fetch('/api/onair/now');
      if (nowResponse.ok) {
        const nowData = await nowResponse.json();
        if (nowData) {
          // Now playing is fetched by useOnAirSocket hook
        }
      }

      // Fetch queue
      const queueResponse = await fetch('/api/onair/queue');
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        // Queue will be fetched by useOnAirSocket
      }

      // Fetch requests
      const requestsResponse = await fetch('/api/onair/requests');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        // Requests will be fetched by useOnAirSocket
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/onair/now', {
        method: 'DELETE',
      });

      if (response.ok) {
        skipSong();
        toast.success('Program ended successfully');
        // Refetch now playing to ensure updated state
        await refetchNowPlaying();
      }
    } catch (error) {
      console.error('Error ending program:', error);
      toast.error('Failed to end program');
    }
  };

  const handleStartProgram = async (programId: string, duration?: number) => {
    try {
      const response = await fetch('/api/onair/program/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId, duration }),
      });

      if (response.ok) {
        toast.success('Program started successfully');
        setShowSchedule(false);
        // Manually refetch now playing as fallback if Socket.IO isn't working
        await refetchNowPlaying();
      }
    } catch (error) {
      console.error('Error starting program:', error);
      toast.error('Failed to start program');
    }
  };

  const handleAddProgramToQueue = async (programId: string, position: number) => {
    try {
      const response = await fetch('/api/onair/program/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          position: position === 999 ? queue.length + 1 : position,
        }),
      });

      if (response.ok) {
        toast.success('Program added to queue');
        setShowSchedule(false);
        // Manually refetch queue as fallback if Socket.IO isn't working
        await refetchQueue();
      }
    } catch (error) {
      console.error('Error adding program to queue:', error);
      toast.error('Failed to add program to queue');
    }
  };

  const handleRemoveFromQueue = async (itemId: string) => {
    try {
      const response = await fetch(`/api/onair/queue?id=${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Removed from queue');
        // Refetch queue to ensure updated state
        await refetchQueue();
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
      toast.error('Failed to remove from queue');
    }
  };

  const handlePlayNext = async () => {
    try {
      const response = await fetch('/api/onair/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'playNext' }),
      });

      if (response.ok) {
        toast.success('Playing next song');
        // Refetch both queue and now playing
        await Promise.all([refetchQueue(), refetchNowPlaying()]);
      }
    } catch (error) {
      console.error('Error playing next:', error);
      toast.error('Failed to play next song');
    }
  };

  const handlePlayQueueItem = async (queueItemId: string) => {
    try {
      const queueItem = queue.find(item => item.id === queueItemId);
      if (!queueItem) {
        toast.error('Queue item not found');
        return;
      }

      const response = await fetch('/api/onair/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: queueItem.itemType,
          title: queueItem.title,
          artist: queueItem.artist,
          duration: queueItem.duration,
          thumbnailUrl: queueItem.thumbnailUrl,
          audioUrl: queueItem.audioUrl,
          programId: queueItem.programId,
        }),
      });

      if (response.ok) {
        toast.success('Now playing');
        // Refetch to ensure state is updated
        await Promise.all([refetchNowPlaying(), refetchQueue()]);
        // Remove from queue after successful play
        await handleRemoveFromQueue(queueItemId);
      }
    } catch (error) {
      console.error('Error playing queue item:', error);
      toast.error('Failed to play item');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/onair/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (response.ok) {
        approveRequest(requestId);
        toast.success('Request approved');
        // Refetch requests to ensure updated state
        await refetchRequests();
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/onair/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (response.ok) {
        rejectRequest(requestId);
        toast.success('Request rejected');
        // Refetch requests to ensure updated state
        await refetchRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                Live On-Air Dashboard
              </h1>
              <p className="text-slate-400">
                Manage your broadcast schedule and day-to-day programming
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isConnected
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-5 h-5" />
                <span className="font-medium">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5" />
                <span className="font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Now Playing & Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Now Playing */}
          <NowPlayingCard nowPlaying={nowPlaying} onSkip={handleSkip} />

          {/* Queue */}
          <QueueList
            queue={queue}
            onUpdateQueue={updateQueue}
            onRemoveItem={handleRemoveFromQueue}
            onPlayNext={handlePlayNext}
            onPlayItem={handlePlayQueueItem}
          />

          {/* Today's Schedule */}
          {showSchedule && (
            <div className="relative">
              <TodaysSchedule
                organizationId={(session?.user as any)?.organizationId || ''}
                onStartProgram={handleStartProgram}
                onAddToQueue={handleAddProgramToQueue}
                queuedProgramIds={queue.map(item => item.programId || '').filter(Boolean)}
              />
              <button
                onClick={() => setShowSchedule(false)}
                className="absolute top-4 right-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors z-10"
              >
                Close Schedule
              </button>
            </div>
          )}

          {!showSchedule && (
            <button
              onClick={() => setShowSchedule(true)}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
            >
              View Today's Schedule
            </button>
          )}
        </div>

        {/* Right Column - Requests */}
        <div className="space-y-6">
          {/* Live Requests */}
          <LiveRequestsFeed
            requests={requests}
            onApprove={handleApproveRequest}
            onReject={handleRejectRequest}
          />
        </div>
      </div>
    </div>
  );
}
