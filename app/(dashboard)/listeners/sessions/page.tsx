'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Clock, Users, Phone, MessageSquare, Globe, Smartphone, Monitor, X, Loader2 } from 'lucide-react';
import { FeatureGuard } from '@/components/feature-guard';
import { Feature } from '@/lib/features';
import { ListenersLayout } from '../components/listeners-layout';
import { toast } from 'sonner';

interface ListenerSession {
  id: string;
  sessionId: string;
  ipAddress: string;
  userAgent?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  programId?: string;
  programName?: string;
  platform?: string;
  deviceType?: string;
  listenerName?: string;
  listenerPhone?: string;
  source?: string;
}

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
  const [sessions, setSessions] = useState<ListenerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/listener/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.organizationId) {
      fetchSessions();
    }
  }, [session]);

  const handleEndSession = async (sessionItem: ListenerSession) => {
    setEndingSessionId(sessionItem.sessionId);
    try {
      const response = await fetch('/api/listener/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionItem.sessionId }),
      });

      if (response.ok) {
        toast.success('Session ended successfully');
        // Update the session in the local state
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === sessionItem.sessionId
              ? { ...s, endedAt: new Date().toISOString(), durationSeconds: Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 1000) }
              : s
          )
        );
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to end session');
      }
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    } finally {
      setEndingSessionId(null);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    if (filter === 'ACTIVE') return !s.endedAt;
    if (filter === 'ENDED') return !!s.endedAt;
    return true;
  });

  const activeSessions = sessions.filter((s) => !s.endedAt).length;
  const endedSessions = sessions.filter((s) => !!s.endedAt).length;

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'SMS':
        return <MessageSquare className="w-4 h-4" />;
      case 'WHATSAPP':
        return <Phone className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'WEBSITE':
        return <Globe className="w-4 h-4" />;
      case 'MOBILE_APP':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <ListenersLayout
      title="Listener Sessions"
      description="View all listener sessions and activity"
    >
      {/* Filter Tabs & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-1.5 border border-white/10 inline-flex gap-1">
          {[
            { key: 'ALL', label: 'All Sessions', count: sessions.length },
            { key: 'ACTIVE', label: 'Active', count: activeSessions },
            { key: 'ENDED', label: 'Ended', count: endedSessions },
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
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {activeSessions > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 text-sm font-medium">
              {activeSessions} active now
            </span>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden">
          {filteredSessions.length > 0 ? (
            <div className="divide-y divide-white/10">
              {filteredSessions.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  className="p-4 sm:p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar/Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          sessionItem.endedAt
                            ? 'bg-slate-500/20 border border-slate-500/30'
                            : 'bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 border border-emerald-400/30'
                        }`}
                      >
                        <Users
                          className={`w-6 h-6 ${
                            sessionItem.endedAt ? 'text-slate-400' : 'text-emerald-300'
                          }`}
                        />
                      </div>

                      {/* Session Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-white">
                            {sessionItem.listenerName ||
                              (sessionItem.city && sessionItem.country
                                ? `${sessionItem.city}, ${sessionItem.country}`
                                : sessionItem.country || 'Unknown Location')}
                          </h4>
                          {!sessionItem.endedAt && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          {sessionItem.listenerPhone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{sessionItem.listenerPhone}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{sessionItem.ipAddress}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {Math.floor(sessionItem.durationSeconds / 60)}m{' '}
                              {sessionItem.durationSeconds % 60}s
                            </span>
                          </div>

                          {sessionItem.source && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              {getSourceIcon(sessionItem.source)}
                              <span className="text-xs">{sessionItem.source}</span>
                            </div>
                          )}

                          {sessionItem.deviceType && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                              {getDeviceIcon(sessionItem.deviceType)}
                              <span className="text-xs">{sessionItem.deviceType}</span>
                            </div>
                          )}
                        </div>

                        {sessionItem.programName && (
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
                            <span className="text-xs text-orange-400">Program:</span>
                            <span className="text-xs font-medium text-orange-300">
                              {sessionItem.programName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp & Actions */}
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">
                          {new Date(sessionItem.startedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(sessionItem.startedAt).toLocaleTimeString()}
                        </p>
                      </div>

                      {!sessionItem.endedAt && (
                        <button
                          onClick={() => handleEndSession(sessionItem)}
                          disabled={endingSessionId === sessionItem.sessionId}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {endingSessionId === sessionItem.sessionId ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Ending...
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              End
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-lg text-slate-400 font-medium">No {filter.toLowerCase()} sessions found</p>
              <p className="text-sm text-slate-500 mt-2">
                Sessions will appear here as listeners engage with your station
              </p>
            </div>
          )}
        </div>
      </div>
    </ListenersLayout>
  );
}
