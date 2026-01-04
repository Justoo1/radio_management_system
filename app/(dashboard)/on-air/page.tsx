'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { useOnAirPolling } from './hooks/use-onair-polling';
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
    refetchQueue,
    refetchNowPlaying,
    refetchRequests,
  } = useOnAirPolling(
    (session?.user as any)?.organizationId || '',
    (session?.user as any)?.id || ''
  );


  const handleSkip = async () => {
    try {
      const response = await fetch('/api/onair/now', {
        method: 'DELETE',
      });

      if (response.ok) {
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

  const handleQueueReorder = async (items: typeof queue) => {
    try {
      const response = await fetch('/api/onair/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          items: items.map((item, index) => ({
            id: item.id,
            position: index + 1,
          })),
        }),
      });

      if (response.ok) {
        // Refetch queue to ensure consistency
        await refetchQueue();
      }
    } catch (error) {
      console.error('Error reordering queue:', error);
      toast.error('Failed to reorder queue');
      // Refetch to restore previous state
      await refetchQueue();
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
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg flex-shrink-0">
              <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 truncate">
                Live On-Air Dashboard
              </h1>
              <p className="text-slate-400 text-sm sm:text-base hidden sm:block">
                Manage your broadcast schedule and day-to-day programming
              </p>
            </div>
          </div>

          {/* Connection Status */}
          <div
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg flex-shrink-0 ${
              isConnected
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Now Playing & Queue */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Now Playing */}
          <NowPlayingCard nowPlaying={nowPlaying} onSkip={handleSkip} />

          {/* Queue */}
          <QueueList
            queue={queue}
            onUpdateQueue={handleQueueReorder}
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
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold text-base sm:text-lg transition-all shadow-lg"
            >
              View Today's Schedule
            </button>
          )}
        </div>

        {/* Right Column - Requests */}
        <div className="space-y-4 sm:space-y-6">
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
