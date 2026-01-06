'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Clock,
  Users,
  Phone,
  MessageSquare,
  Globe,
  Smartphone,
  Radio,
  Loader2,
  TrendingUp,
  Play,
  Pause,
  CheckCircle,
  Trash2,
  Music,
  Trophy,
} from 'lucide-react';
import { FeatureGuard } from '@/components/feature-guard';
import { Feature } from '@/lib/features';
import { ListenersLayout } from '../components/listeners-layout';
import { toast } from 'sonner';

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
  songRequests: number;
  contestEntries: number;
  dedications: number;
  shoutouts: number;
  startedAt: string;
  endedAt?: string;
  program?: { id: string; name: string };
  createdBy?: { id: string; name: string };
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
  PHONE_CALL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SMS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  WHATSAPP: 'bg-green-500/20 text-green-400 border-green-500/30',
  WEBSITE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  SOCIAL_MEDIA: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  MOBILE_APP: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MIXED: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  PAUSED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function ListenerSessions() {
  return (
    <FeatureGuard
      feature={Feature.LISTENER_TRACKING}
      featureDescription="View detailed session history and track listener activity over time"
    >
      <SessionsContent />
    </FeatureGuard>
  );
}

function SessionsContent() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<EngagementSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/listener/engagement?limit=100');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchSessions();
    }
  }, [session]);

  const handleStatusChange = async (sessionId: string, newStatus: string) => {
    setActionLoading(sessionId);
    try {
      const response = await fetch('/api/listener/engagement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Session ${newStatus.toLowerCase()}`);
        fetchSessions();
      } else {
        toast.error('Failed to update session');
      }
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setActionLoading(sessionId);
    try {
      const response = await fetch(`/api/listener/engagement?sessionId=${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Session deleted');
        fetchSessions();
      } else {
        toast.error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const counts = {
    all: sessions.length,
    ACTIVE: sessions.filter((s) => s.status === 'ACTIVE').length,
    PAUSED: sessions.filter((s) => s.status === 'PAUSED').length,
    COMPLETED: sessions.filter((s) => s.status === 'COMPLETED').length,
  };

  const getTotalEngagement = (s: EngagementSession) =>
    s.phoneCallCount + s.smsCount + s.whatsappCount + s.socialMediaCount + s.websiteCount + s.mobileAppCount;

  const formatDuration = (startedAt: string, endedAt?: string) => {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <ListenersLayout
      title="Engagement Sessions"
      description="View and manage all engagement tracking sessions"
    >
      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 inline-flex gap-1 flex-wrap">
          {[
            { key: 'all', label: 'All Sessions' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'PAUSED', label: 'Paused' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.key ? 'bg-white/20' : 'bg-white/10'
                }`}
              >
                {counts[tab.key as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>

        {counts.ACTIVE > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 text-sm font-medium">
              {counts.ACTIVE} active now
            </span>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {filteredSessions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredSessions.map((sessionItem) => {
                const SourceIcon = sourceIcons[sessionItem.source] || TrendingUp;
                const totalEngagement = getTotalEngagement(sessionItem);

                return (
                  <div
                    key={sessionItem.id}
                    className="p-4 sm:p-5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Source Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${sourceColors[sessionItem.source] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                            <SourceIcon className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-white">
                                {sessionItem.name || `${sessionItem.source.replace('_', ' ')} Session`}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[sessionItem.status]}`}>
                                {sessionItem.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(sessionItem.startedAt, sessionItem.endedAt)}
                              </span>
                              {sessionItem.program && (
                                <span className="text-orange-400">{sessionItem.program.name}</span>
                              )}
                              {sessionItem.createdBy && (
                                <span>by {sessionItem.createdBy.name}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Total Engagement */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{totalEngagement}</p>
                            <p className="text-xs text-slate-500">total engagements</p>
                          </div>
                        </div>
                      </div>

                      {/* Engagement Stats */}
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                        <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                          <Phone className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.phoneCallCount}</p>
                          <p className="text-[10px] text-slate-500">Calls</p>
                        </div>
                        <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                          <MessageSquare className="w-4 h-4 mx-auto text-purple-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.smsCount}</p>
                          <p className="text-[10px] text-slate-500">SMS</p>
                        </div>
                        <div className="text-center p-2 bg-green-500/10 rounded-lg">
                          <MessageSquare className="w-4 h-4 mx-auto text-green-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.whatsappCount}</p>
                          <p className="text-[10px] text-slate-500">WhatsApp</p>
                        </div>
                        <div className="text-center p-2 bg-pink-500/10 rounded-lg">
                          <Radio className="w-4 h-4 mx-auto text-pink-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.socialMediaCount}</p>
                          <p className="text-[10px] text-slate-500">Social</p>
                        </div>
                        <div className="text-center p-2 bg-cyan-500/10 rounded-lg">
                          <Globe className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.websiteCount}</p>
                          <p className="text-[10px] text-slate-500">Website</p>
                        </div>
                        <div className="text-center p-2 bg-orange-500/10 rounded-lg">
                          <Music className="w-4 h-4 mx-auto text-orange-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.songRequests}</p>
                          <p className="text-[10px] text-slate-500">Requests</p>
                        </div>
                        <div className="text-center p-2 bg-yellow-500/10 rounded-lg">
                          <Trophy className="w-4 h-4 mx-auto text-yellow-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.contestEntries}</p>
                          <p className="text-[10px] text-slate-500">Contest</p>
                        </div>
                        <div className="text-center p-2 bg-slate-500/10 rounded-lg">
                          <Users className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                          <p className="text-sm font-bold text-white">{sessionItem.dedications + sessionItem.shoutouts}</p>
                          <p className="text-[10px] text-slate-500">Ded/Shout</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <p className="text-xs text-slate-500">
                          Started {new Date(sessionItem.startedAt).toLocaleString()}
                          {sessionItem.endedAt && ` | Ended ${new Date(sessionItem.endedAt).toLocaleString()}`}
                        </p>
                        <div className="flex items-center gap-2">
                          {sessionItem.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleStatusChange(sessionItem.id, 'PAUSED')}
                              disabled={actionLoading === sessionItem.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors border border-amber-500/30 disabled:opacity-50"
                            >
                              {actionLoading === sessionItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
                              Pause
                            </button>
                          )}
                          {sessionItem.status === 'PAUSED' && (
                            <button
                              onClick={() => handleStatusChange(sessionItem.id, 'ACTIVE')}
                              disabled={actionLoading === sessionItem.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors border border-emerald-500/30 disabled:opacity-50"
                            >
                              {actionLoading === sessionItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                              Resume
                            </button>
                          )}
                          {(sessionItem.status === 'ACTIVE' || sessionItem.status === 'PAUSED') && (
                            <button
                              onClick={() => handleStatusChange(sessionItem.id, 'COMPLETED')}
                              disabled={actionLoading === sessionItem.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-colors border border-purple-500/30 disabled:opacity-50"
                            >
                              {actionLoading === sessionItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(sessionItem.id)}
                            disabled={actionLoading === sessionItem.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/30 disabled:opacity-50"
                          >
                            {actionLoading === sessionItem.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-lg text-slate-400 font-medium">
                No {filter === 'all' ? '' : filter.toLowerCase()} sessions found
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Start an engagement session from the Listeners page to track listener interactions
              </p>
            </div>
          )}
        </div>
      </div>
    </ListenersLayout>
  );
}
