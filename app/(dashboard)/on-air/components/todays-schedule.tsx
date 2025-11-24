/**
 * Today's Schedule Component
 * Shows today's scheduled programs with actions to start or queue them
 */

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Play, Plus } from 'lucide-react';

interface ScheduleItem {
  id: string;
  programId: string;
  programName: string;
  description: string | null;
  genre: string | null;
  duration: number;
  startTime: string;
  endTime: string;
  host: {
    id: string;
    name: string;
  } | null;
  thumbnailUrl: string | null;
  notes: string | null;
}

interface TodaysScheduleProps {
  organizationId: string;
  onStartProgram: (programId: string, duration?: number) => void;
  onAddToQueue: (programId: string, position: number) => void;
  queuedProgramIds?: string[];
}

export function TodaysSchedule({
  organizationId,
  onStartProgram,
  onAddToQueue,
  queuedProgramIds = [],
}: TodaysScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, [organizationId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/onair/schedule');

      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const data = await response.json();
      setSchedule(data.schedule || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    // time is in format "HH:MM"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const isProgramPassed = (endTime: string): boolean => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return endTime <= currentTime;
  };

  const upcomingPrograms = schedule.filter(
    item => !isProgramPassed(item.endTime) && !queuedProgramIds.includes(item.programId)
  );
  const pastPrograms = schedule.filter(item => isProgramPassed(item.endTime));

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-purple-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
        </div>
        <div className="text-center py-8 text-slate-400">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-purple-400" size={20} />
          <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchSchedule}
            className="text-sm text-purple-400 hover:text-purple-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="text-purple-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Today's Schedule</h3>
          </div>
          <div className="text-sm text-slate-400">{getDayName()}</div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        {schedule.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 mb-2">No programs scheduled for today</p>
            <p className="text-sm text-slate-500">
              Add program schedules in the Programs section
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Programs */}
            {upcomingPrograms.length > 0 && (
              <>
                <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700 sticky top-0">
                  <h4 className="text-sm font-semibold text-purple-400">Upcoming Programs</h4>
                </div>
                <div className="divide-y divide-slate-800">
                  {upcomingPrograms.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-800/50 transition group"
                    >
                      <div className="flex items-start gap-4">
                        {/* Time */}
                        <div className="flex-shrink-0 w-24 text-center">
                          <div className="flex items-center justify-center gap-1 text-purple-400 text-sm font-medium">
                            <Clock size={14} />
                            {formatTime(item.startTime)}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {item.duration} min
                          </div>
                        </div>

                        {/* Program Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium mb-1 truncate">
                            {item.programName}
                          </h4>

                          {item.host && (
                            <div className="flex items-center gap-1 text-sm text-slate-400 mb-1">
                              <User size={14} />
                              {item.host.name}
                            </div>
                          )}

                          {item.genre && (
                            <div className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 mb-2">
                              {item.genre}
                            </div>
                          )}

                          {item.description && (
                            <p className="text-sm text-slate-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => onStartProgram(item.programId, item.duration)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg transition"
                            title="Start Now"
                          >
                            <Play size={14} />
                            Start
                          </button>
                          <button
                            onClick={() => onAddToQueue(item.programId, 999)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition"
                            title="Add to Queue"
                          >
                            <Plus size={14} />
                            Queue
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Past Programs */}
            {pastPrograms.length > 0 && (
              <>
                <div className="px-6 py-3 bg-slate-800/50 border-b border-slate-700 sticky top-0">
                  <h4 className="text-sm font-semibold text-slate-500">Past Programs</h4>
                </div>
                <div className="divide-y divide-slate-800">
                  {pastPrograms.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 opacity-60"
                    >
                      <div className="flex items-start gap-4">
                        {/* Time */}
                        <div className="flex-shrink-0 w-24 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-500 text-sm font-medium">
                            <Clock size={14} />
                            {formatTime(item.startTime)}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {item.duration} min
                          </div>
                        </div>

                        {/* Program Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-slate-400 font-medium mb-1 truncate">
                            {item.programName}
                          </h4>

                          {item.host && (
                            <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                              <User size={14} />
                              {item.host.name}
                            </div>
                          )}

                          {item.genre && (
                            <div className="inline-block px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-500 mb-2">
                              {item.genre}
                            </div>
                          )}

                          {item.description && (
                            <p className="text-sm text-slate-500 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.notes && (
                            <p className="text-xs text-slate-600 mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>

                        {/* Disabled Actions */}
                        <div className="flex-shrink-0 flex flex-col gap-2 cursor-not-allowed">
                          <button
                            disabled
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-500 text-sm rounded-lg opacity-50 cursor-not-allowed"
                            title="Program has already aired"
                          >
                            <Play size={14} />
                            Start
                          </button>
                          <button
                            disabled
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-500 text-sm rounded-lg opacity-50 cursor-not-allowed"
                            title="Program has already aired"
                          >
                            <Plus size={14} />
                            Queue
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
