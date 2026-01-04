'use client';

import { useEffect, useState } from 'react';
import { Music, Clock, SkipForward } from 'lucide-react';
import { NowPlayingData } from '../hooks/use-onair-socket';

interface NowPlayingCardProps {
  nowPlaying: NowPlayingData | null;
  onSkip: () => void;
}

export function NowPlayingCard({ nowPlaying, onSkip }: NowPlayingCardProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!nowPlaying) {
      setRemainingSeconds(0);
      return;
    }

    // Calculate remaining time based on startedAt and duration
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const startedAt = new Date(nowPlaying.startedAt).getTime();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const remaining = Math.max(0, nowPlaying.duration - elapsedSeconds);
      return remaining;
    };

    // Set initial remaining time
    setRemainingSeconds(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newRemaining = prev - 1;
        if (newRemaining <= 0) {
          clearInterval(interval);
          // Auto-skip when program ends
          onSkip();
          return 0;
        }
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [nowPlaying, onSkip]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!nowPlaying) return 0;
    return ((nowPlaying.duration - remainingSeconds) / nowPlaying.duration) * 100;
  };

  if (!nowPlaying) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 sm:p-8 border border-slate-700 shadow-2xl">
        <div className="flex flex-col items-center justify-center h-48 sm:h-64 text-slate-400">
          <Music className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-50" />
          <p className="text-lg sm:text-xl font-medium">Nothing Playing</p>
          <p className="text-xs sm:text-sm mt-2 text-center px-4">Add a song to the queue to start broadcasting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 rounded-xl p-4 sm:p-6 lg:p-8 border border-purple-500/20 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        {/* Album Art */}
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
          {nowPlaying.thumbnailUrl ? (
            <img
              src={nowPlaying.thumbnailUrl}
              alt={nowPlaying.title}
              className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-lg object-cover shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Music className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0 w-full">
              <div className="inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 mb-2 sm:mb-3">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                LIVE ON AIR
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 truncate">
                {nowPlaying.title}
              </h2>
              {nowPlaying.artist && (
                <p className="text-base sm:text-lg lg:text-xl text-purple-200 mb-2 sm:mb-4 truncate">{nowPlaying.artist}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-purple-300">
                <span className="px-2 py-1 rounded bg-white/10 text-xs sm:text-sm">
                  {nowPlaying.itemType}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Duration: </span>{formatTime(nowPlaying.duration)}
                </span>
              </div>
            </div>

            {/* Skip Button */}
            <button
              onClick={onSkip}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20 flex-shrink-0"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Skip</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs sm:text-sm text-purple-200 mb-2">
              <span className="flex-shrink-0">{formatTime(nowPlaying.duration - remainingSeconds)}</span>
              <span className="font-bold text-white text-sm sm:text-base lg:text-lg px-2">
                -{formatTime(remainingSeconds)}
              </span>
              <span className="flex-shrink-0">{formatTime(nowPlaying.duration)}</span>
            </div>
            <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-linear"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Large Countdown Timer */}
          <div className="mt-4 sm:mt-6 text-center">
            <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-white/10 rounded-xl border-2 border-white/20">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-white tabular-nums">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-xs text-purple-300 mt-1">TIME REMAINING</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
