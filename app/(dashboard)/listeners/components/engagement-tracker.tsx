'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Phone,
  MessageSquare,
  Globe,
  Smartphone,
  Radio,
  Plus,
  Minus,
  Pause,
  Play,
  CheckCircle,
  Loader2,
  Music,
  Trophy,
  Heart,
  Megaphone,
  MoreHorizontal,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPusherClient, PUSHER_CHANNELS } from '@/lib/pusher/client';

interface EngagementSession {
  id: string;
  name?: string;
  source: string;
  status: string;
  phoneCallCount: number;
  smsCount: number;
  whatsappCount: number;
  socialMediaCount: number;
  websiteCount: number;
  mobileAppCount: number;
  otherCount: number;
  uniqueCallers: number;
  contestEntries: number;
  songRequests: number;
  dedications: number;
  shoutouts: number;
  notes?: string;
  startedAt: string;
  endedAt?: string;
  program?: { id: string; name: string };
  createdBy?: { id: string; name: string };
}

interface TodayTotals {
  phoneCallCount: number;
  smsCount: number;
  whatsappCount: number;
  socialMediaCount: number;
  websiteCount: number;
  mobileAppCount: number;
  songRequests: number;
  contestEntries: number;
  totalEngagements: number;
}

const sourceIcons: Record<string, any> = {
  PHONE_CALL: Phone,
  SMS: MessageSquare,
  WHATSAPP: MessageSquare,
  WEBSITE: Globe,
  SOCIAL_MEDIA: Radio,
  MOBILE_APP: Smartphone,
  MIXED: TrendingUp,
};

const sourceColors: Record<string, string> = {
  PHONE_CALL: 'from-blue-500 to-blue-600',
  SMS: 'from-purple-500 to-purple-600',
  WHATSAPP: 'from-green-500 to-green-600',
  WEBSITE: 'from-cyan-500 to-cyan-600',
  SOCIAL_MEDIA: 'from-pink-500 to-pink-600',
  MOBILE_APP: 'from-orange-500 to-orange-600',
  MIXED: 'from-indigo-500 to-indigo-600',
};

interface CounterButtonProps {
  icon: any;
  label: string;
  count: number;
  color: string;
  onIncrement: () => void;
  onDecrement: () => void;
  loading?: boolean;
}

function CounterButton({ icon: Icon, label, count, color, onIncrement, onDecrement, loading }: CounterButtonProps) {
  return (
    <div className={`relative bg-gradient-to-br ${color} rounded-xl p-3 border border-white/20`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/80" />
          <span className="text-xs font-medium text-white/80">{label}</span>
        </div>
        <span className="text-2xl font-bold text-white">{count}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onDecrement}
          disabled={count === 0 || loading}
          className="flex-1 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="w-4 h-4 text-white mx-auto" />
        </button>
        <button
          onClick={onIncrement}
          disabled={loading}
          className="flex-1 p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-white mx-auto animate-spin" />
          ) : (
            <Plus className="w-4 h-4 text-white mx-auto" />
          )}
        </button>
      </div>
    </div>
  );
}

interface ActiveSessionCardProps {
  session: EngagementSession;
  onUpdate: () => void;
  onStatusChange: (sessionId: string, status: string) => void;
}

function ActiveSessionCard({ session, onUpdate, onStatusChange }: ActiveSessionCardProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAllCounters, setShowAllCounters] = useState(false);
  const SourceIcon = sourceIcons[session.source] || TrendingUp;

  const updateCount = async (field: string, increment: number) => {
    setUpdating(field);
    try {
      const response = await fetch('/api/listener/engagement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          action: 'increment',
          [field]: increment,
        }),
      });

      if (response.ok) {
        onUpdate();
      } else {
        toast.error('Failed to update count');
      }
    } catch (error) {
      console.error('Error updating count:', error);
      toast.error('Failed to update count');
    } finally {
      setUpdating(null);
    }
  };

  const totalEngagement =
    session.phoneCallCount +
    session.smsCount +
    session.whatsappCount +
    session.socialMediaCount +
    session.websiteCount +
    session.mobileAppCount;

  const duration = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000 / 60);

  // Primary counters based on source
  const primaryCounters = [
    { field: 'phoneCallCount', icon: Phone, label: 'Calls', count: session.phoneCallCount, color: 'from-blue-500/20 to-blue-600/20' },
    { field: 'smsCount', icon: MessageSquare, label: 'SMS', count: session.smsCount, color: 'from-purple-500/20 to-purple-600/20' },
    { field: 'whatsappCount', icon: MessageSquare, label: 'WhatsApp', count: session.whatsappCount, color: 'from-green-500/20 to-green-600/20' },
    { field: 'socialMediaCount', icon: Radio, label: 'Social', count: session.socialMediaCount, color: 'from-pink-500/20 to-pink-600/20' },
  ];

  // Additional counters
  const additionalCounters = [
    { field: 'songRequests', icon: Music, label: 'Song Requests', count: session.songRequests, color: 'from-orange-500/20 to-orange-600/20' },
    { field: 'contestEntries', icon: Trophy, label: 'Contest', count: session.contestEntries, color: 'from-yellow-500/20 to-yellow-600/20' },
    { field: 'dedications', icon: Heart, label: 'Dedications', count: session.dedications, color: 'from-red-500/20 to-red-600/20' },
    { field: 'shoutouts', icon: Megaphone, label: 'Shoutouts', count: session.shoutouts, color: 'from-cyan-500/20 to-cyan-600/20' },
  ];

  const isPaused = session.status === 'PAUSED';

  return (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border overflow-hidden ${isPaused ? 'border-amber-500/50' : 'border-white/20'}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${isPaused ? 'from-amber-600/80 to-amber-700/80' : sourceColors[session.source] || 'from-indigo-500 to-indigo-600'} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {isPaused ? <Pause className="w-5 h-5 text-white" /> : <SourceIcon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">
                  {session.name || `${session.source.replace('_', ' ')} Session`}
                </h3>
                {isPaused && (
                  <span className="px-2 py-0.5 bg-amber-900/50 border border-amber-400/50 rounded-full text-xs font-medium text-amber-200">
                    PAUSED
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <Clock className="w-3 h-3" />
                <span>{duration}m {isPaused ? 'total' : 'active'}</span>
                {session.program && (
                  <>
                    <span className="text-white/50">|</span>
                    <span>{session.program.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white/20 rounded-lg">
              <span className="text-lg font-bold text-white">{totalEngagement}</span>
              <span className="text-xs text-white/80 ml-1">total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Counters */}
      <div className="p-4 space-y-4">
        {/* Primary Counters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {primaryCounters.map((counter) => (
            <CounterButton
              key={counter.field}
              icon={counter.icon}
              label={counter.label}
              count={counter.count}
              color={counter.color}
              onIncrement={() => updateCount(counter.field, 1)}
              onDecrement={() => updateCount(counter.field, -1)}
              loading={updating === counter.field}
            />
          ))}
        </div>

        {/* Additional Counters (Expandable) */}
        <div>
          <button
            onClick={() => setShowAllCounters(!showAllCounters)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
            {showAllCounters ? 'Hide' : 'Show'} additional counters
          </button>

          {showAllCounters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {additionalCounters.map((counter) => (
                <CounterButton
                  key={counter.field}
                  icon={counter.icon}
                  label={counter.label}
                  count={counter.count}
                  color={counter.color}
                  onIncrement={() => updateCount(counter.field, 1)}
                  onDecrement={() => updateCount(counter.field, -1)}
                  loading={updating === counter.field}
                />
              ))}
            </div>
          )}
        </div>

        {/* Session Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="text-xs text-slate-500">
            Started {new Date(session.startedAt).toLocaleTimeString()}
            {session.createdBy && ` by ${session.createdBy.name}`}
          </div>
          <div className="flex items-center gap-2">
            {session.status === 'ACTIVE' && (
              <button
                onClick={() => onStatusChange(session.id, 'PAUSED')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors border border-amber-500/30"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            {session.status === 'PAUSED' && (
              <button
                onClick={() => onStatusChange(session.id, 'ACTIVE')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
            )}
            <button
              onClick={() => onStatusChange(session.id, 'COMPLETED')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors border border-purple-500/30"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EngagementTrackerProps {
  onStartSession: () => void;
}

export function EngagementTracker({ onStartSession }: EngagementTrackerProps) {
  const { data: session } = useSession();
  const [activeSessions, setActiveSessions] = useState<EngagementSession[]>([]);
  const [todayTotals, setTodayTotals] = useState<TodayTotals | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!session?.user) return;

    try {
      // Fetch both ACTIVE and PAUSED sessions
      const [activeRes, pausedRes] = await Promise.all([
        fetch('/api/listener/engagement?status=ACTIVE'),
        fetch('/api/listener/engagement?status=PAUSED'),
      ]);

      if (activeRes.ok && pausedRes.ok) {
        const activeData = await activeRes.json();
        const pausedData = await pausedRes.json();

        // Combine active and paused sessions
        const allSessions = [
          ...(activeData.sessions || []),
          ...(pausedData.sessions || []),
        ];

        setActiveSessions(allSessions);
        setTodayTotals(activeData.todayTotals || null);
      }
    } catch (error) {
      console.error('Error fetching engagement sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Subscribe to real-time updates
  useEffect(() => {
    const organizationId = (session?.user as any)?.organizationId;
    if (!organizationId) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = PUSHER_CHANNELS.listeners(organizationId);
    const channel = pusher.subscribe(channelName);

    channel.bind('engagement:updated', () => {
      fetchSessions();
    });

    channel.bind('session:started', () => {
      fetchSessions();
    });

    channel.bind('session:ended', () => {
      fetchSessions();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [session, fetchSessions]);

  const handleStatusChange = async (sessionId: string, status: string) => {
    try {
      const response = await fetch('/api/listener/engagement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status }),
      });

      if (response.ok) {
        if (status === 'COMPLETED') {
          toast.success('Session completed and saved to metrics');
        }
        fetchSessions();
      } else {
        toast.error('Failed to update session status');
      }
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Totals Summary */}
      {todayTotals && todayTotals.totalEngagements > 0 && (
        <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Today's Engagement
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{todayTotals.totalEngagements}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{todayTotals.phoneCallCount}</p>
              <p className="text-xs text-slate-400">Calls</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{todayTotals.smsCount}</p>
              <p className="text-xs text-slate-400">SMS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{todayTotals.whatsappCount}</p>
              <p className="text-xs text-slate-400">WhatsApp</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-pink-400">{todayTotals.socialMediaCount}</p>
              <p className="text-xs text-slate-400">Social</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-cyan-400">{todayTotals.websiteCount}</p>
              <p className="text-xs text-slate-400">Website</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{todayTotals.songRequests}</p>
              <p className="text-xs text-slate-400">Requests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{todayTotals.contestEntries}</p>
              <p className="text-xs text-slate-400">Contest</p>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Active Engagement Sessions ({activeSessions.length})
            </h3>
            <button
              onClick={onStartSession}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>

          <div className="space-y-4">
            {activeSessions.map((engagementSession) => (
              <ActiveSessionCard
                key={engagementSession.id}
                session={engagementSession}
                onUpdate={fetchSessions}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center border border-purple-400/30">
            <Phone className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Sessions</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Start an engagement session to track phone calls, SMS messages, WhatsApp interactions, and more from your listeners.
          </p>
          <button
            onClick={onStartSession}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            Start Engagement Session
          </button>
        </div>
      )}
    </div>
  );
}
