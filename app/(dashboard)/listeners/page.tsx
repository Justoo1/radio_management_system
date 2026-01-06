'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Activity,
  Users,
  Clock,
  MessageSquare,
  MapPin,
  Phone,
  ArrowUpRight,
  Radio,
  Plus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { FeatureGuard } from '@/components/feature-guard';
import { Feature } from '@/lib/features';
import { ListenersLayout } from './components/listeners-layout';
import { StartSessionModal } from './components/start-session-modal';
import { ListenerChatFeed } from './components/listener-chat-feed';
import { DashboardChat } from './components/dashboard-chat';
import { ShareableLink } from './components/shareable-link';
import { useListenerRealtime } from './hooks/use-listener-realtime';

export default function ListenersOverview() {
  return (
    <FeatureGuard
      feature={Feature.LISTENER_TRACKING}
      featureDescription="Track listener engagement, sessions, and analytics to understand your audience better"
    >
      <ListenersContent />
    </FeatureGuard>
  );
}

function ListenersContent() {
  const { data: session } = useSession();
  const [showStartSession, setShowStartSession] = useState(false);
  const organizationId = (session?.user as any)?.organizationId || '';

  const {
    loading,
    stats,
    requests,
    isConnected,
    isPusherAvailable,
    refetchStats,
    refetchRequests,
  } = useListenerRealtime(organizationId, {
    enabled: !!organizationId,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Sessions',
      value: stats?.totalSessions || 0,
      subtitle: 'All time',
      icon: Activity,
      gradient: 'from-blue-600/20 to-purple-600/20',
      iconGradient: 'from-blue-500/30 to-blue-600/30',
      borderColor: 'hover:border-blue-500/50',
      shadowColor: 'hover:shadow-blue-500/20',
      iconColor: 'text-blue-300',
      borderIconColor: 'border-blue-400/30',
    },
    {
      title: 'Active Now',
      value: stats?.activeSessions || 0,
      subtitle: 'Currently listening',
      icon: Users,
      gradient: 'from-purple-600/20 to-pink-600/20',
      iconGradient: 'from-purple-500/30 to-pink-600/30',
      borderColor: 'hover:border-purple-500/50',
      shadowColor: 'hover:shadow-purple-500/20',
      iconColor: 'text-purple-300',
      borderIconColor: 'border-purple-400/30',
      highlight: stats?.activeSessions && stats.activeSessions > 0,
    },
    {
      title: 'Avg. Duration',
      value: `${stats?.avgDurationMinutes || 0}m`,
      subtitle: 'Per session',
      icon: Clock,
      gradient: 'from-emerald-600/20 to-cyan-600/20',
      iconGradient: 'from-emerald-500/30 to-cyan-600/30',
      borderColor: 'hover:border-emerald-500/50',
      shadowColor: 'hover:shadow-emerald-500/20',
      iconColor: 'text-emerald-300',
      borderIconColor: 'border-emerald-400/30',
    },
    {
      title: 'Total Requests',
      value: stats?.totalRequests || 0,
      subtitle: 'Songs & messages',
      icon: MessageSquare,
      gradient: 'from-orange-600/20 to-red-600/20',
      iconGradient: 'from-orange-500/30 to-red-600/30',
      borderColor: 'hover:border-orange-500/50',
      shadowColor: 'hover:shadow-orange-500/20',
      iconColor: 'text-orange-300',
      borderIconColor: 'border-orange-400/30',
    },
  ];

  return (
    <ListenersLayout
      title="Listener Tracking"
      description="Monitor and analyze your listener engagement"
      actions={
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm text-sm font-medium transition-all ${
              isConnected
                ? isPusherAvailable
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
            title={
              isConnected
                ? isPusherAvailable
                  ? 'Connected via real-time updates'
                  : 'Connected via polling (real-time unavailable)'
                : 'Disconnected'
            }
          >
            {isConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isConnected
                ? isPusherAvailable
                  ? 'Live'
                  : 'Polling'
                : 'Offline'}
            </span>
          </div>

          <button
            onClick={() => setShowStartSession(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            Start Session
          </button>
        </div>
      }
    >
      {/* Start Session Modal */}
      <StartSessionModal
        open={showStartSession}
        onOpenChange={setShowStartSession}
        onSessionCreated={refetchStats}
      />
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="group relative">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${card.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div
                className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 ${card.borderColor} transition-all duration-300 hover:shadow-2xl ${card.shadowColor}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`bg-gradient-to-br ${card.iconGradient} p-3 rounded-xl border ${card.borderIconColor} backdrop-blur`}
                  >
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  {card.highlight && (
                    <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Live
                    </div>
                  )}
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-4xl font-bold text-white mb-2">{card.value}</p>
                <p className="text-slate-500 text-xs">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-2.5 rounded-xl border border-cyan-400/30">
                <MapPin className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Top Locations</h3>
                <p className="text-sm text-slate-400">Where your listeners are from</p>
              </div>
            </div>

            {stats?.topLocations && stats.topLocations.length > 0 ? (
              <div className="space-y-3">
                {stats.topLocations.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-white">{location.country || 'Unknown'}</span>
                    </div>
                    <span className="text-sm text-slate-400">{location.count} sessions</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No location data available</p>
                <p className="text-sm text-slate-500 mt-1">
                  Location data appears as listeners engage
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-600/30 p-2.5 rounded-xl border border-purple-400/30">
                  <Users className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Recent Sessions</h3>
                  <p className="text-sm text-slate-400">Latest listener activity</p>
                </div>
              </div>
              <Link
                href="/listeners/sessions"
                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSessions.slice(0, 5).map((sessionItem) => (
                  <div
                    key={sessionItem.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {sessionItem.city && sessionItem.country
                            ? `${sessionItem.city}, ${sessionItem.country}`
                            : sessionItem.country || sessionItem.ipAddress}
                        </p>
                        <p className="text-xs text-slate-500">
                          {Math.floor(sessionItem.durationSeconds / 60)}m{' '}
                          {sessionItem.durationSeconds % 60}s
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(sessionItem.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No recent sessions</p>
                <p className="text-sm text-slate-500 mt-1">
                  Sessions will appear here as listeners engage
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Chat & Requests Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Dashboard Chat - Real-time group chat with listeners */}
        <DashboardChat />

        {/* Listener Requests/Chat Feed - Song requests, dedications, etc. */}
        <ListenerChatFeed requests={requests} onRefresh={refetchRequests} />
      </div>

      {/* Shareable Public Link */}
      <ShareableLink />

      {/* Traditional FM Radio Call-to-Action */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Traditional FM Radio Station?
              </h3>
              <p className="text-slate-300 mb-4">
                Our listener tracking works for traditional FM broadcasters too! Track engagement
                through multiple channels:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { icon: Phone, label: 'Call-ins' },
                  { icon: MessageSquare, label: 'SMS' },
                  { icon: MessageSquare, label: 'WhatsApp' },
                  { icon: Radio, label: 'Social Media' },
                  { icon: Users, label: 'Contests' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg border border-white/10"
                    >
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-white font-medium">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ListenersLayout>
  );
}
