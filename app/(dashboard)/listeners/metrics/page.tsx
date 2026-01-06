'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Activity,
  TrendingUp,
  Users,
  Clock,
  MessageSquare,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { FeatureGuard } from '@/components/feature-guard';
import { Feature } from '@/lib/features';
import { ListenersLayout } from '../components/listeners-layout';

interface MetricsData {
  timestamp: string;
  hour: number;
  dayOfWeek: number;
  currentListeners: number;
  peakListeners: number;
  totalSessions: number;
  avgDuration: number;
  songRequests: number;
  whatsappMessages: number;
  smsMessages: number;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ListenerMetrics() {
  return (
    <FeatureGuard
      feature={Feature.LISTENER_TRACKING}
      featureDescription="Access detailed analytics, engagement metrics, and listener behavior insights"
    >
      <MetricsContent />
    </FeatureGuard>
  );
}

function MetricsContent() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/listener/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.organizationId) {
      fetchMetrics();
    }
  }, [session]);

  // Calculate summary stats
  const totalSessions = metrics.reduce((sum, m) => sum + m.totalSessions, 0);
  const avgListeners =
    metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.currentListeners, 0) / metrics.length)
      : 0;
  const peakListeners = Math.max(...metrics.map((m) => m.peakListeners), 0);
  const totalEngagement = metrics.reduce(
    (sum, m) => sum + m.songRequests + m.whatsappMessages + m.smsMessages,
    0
  );

  const statsCards = [
    {
      title: 'Total Sessions',
      value: totalSessions,
      subtitle: 'Across all time periods',
      icon: Activity,
      gradient: 'from-blue-600/20 to-purple-600/20',
      iconGradient: 'from-blue-500/30 to-blue-600/30',
      borderColor: 'hover:border-blue-500/50',
      shadowColor: 'hover:shadow-blue-500/20',
      iconColor: 'text-blue-300',
      borderIconColor: 'border-blue-400/30',
    },
    {
      title: 'Avg. Listeners',
      value: avgListeners,
      subtitle: 'Average concurrent',
      icon: Users,
      gradient: 'from-purple-600/20 to-pink-600/20',
      iconGradient: 'from-purple-500/30 to-pink-600/30',
      borderColor: 'hover:border-purple-500/50',
      shadowColor: 'hover:shadow-purple-500/20',
      iconColor: 'text-purple-300',
      borderIconColor: 'border-purple-400/30',
    },
    {
      title: 'Peak Listeners',
      value: peakListeners,
      subtitle: 'Highest recorded',
      icon: TrendingUp,
      gradient: 'from-emerald-600/20 to-cyan-600/20',
      iconGradient: 'from-emerald-500/30 to-cyan-600/30',
      borderColor: 'hover:border-emerald-500/50',
      shadowColor: 'hover:shadow-emerald-500/20',
      iconColor: 'text-emerald-300',
      borderIconColor: 'border-emerald-400/30',
    },
    {
      title: 'Total Engagement',
      value: totalEngagement,
      subtitle: 'Requests & messages',
      icon: MessageSquare,
      gradient: 'from-orange-600/20 to-red-600/20',
      iconGradient: 'from-orange-500/30 to-red-600/30',
      borderColor: 'hover:border-orange-500/50',
      shadowColor: 'hover:shadow-orange-500/20',
      iconColor: 'text-orange-300',
      borderIconColor: 'border-orange-400/30',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <ListenersLayout title="Listener Metrics" description="Detailed analytics and engagement metrics">
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
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">{card.title}</p>
                <p className="text-4xl font-bold text-white mb-2">{card.value}</p>
                <p className="text-slate-500 text-xs">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Metrics */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/30 transition-all duration-300 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-600/30 p-2.5 rounded-xl border border-purple-400/30">
                <BarChart3 className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Hourly Metrics</h3>
                <p className="text-sm text-slate-400">Listener activity broken down by hour</p>
              </div>
            </div>
          </div>

          {metrics.length > 0 ? (
            <div className="divide-y divide-white/10">
              {metrics.slice(0, 10).map((metric, index) => (
                <div
                  key={index}
                  className="p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 border border-blue-400/30 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-300" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {new Date(metric.timestamp).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-slate-400">
                          {dayNames[metric.dayOfWeek]} - Hour {metric.hour}:00
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{metric.totalSessions}</p>
                        <p className="text-xs text-slate-500">Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400">{metric.peakListeners}</p>
                        <p className="text-xs text-slate-500">Peak</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-slate-400">Avg Duration</span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {Math.floor(metric.avgDuration / 60)}m
                      </p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-slate-400">Song Requests</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metric.songRequests}</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-slate-400">WhatsApp</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metric.whatsappMessages}</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-orange-400" />
                        <span className="text-xs text-slate-400">SMS</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{metric.smsMessages}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-slate-600" />
              </div>
              <p className="text-lg text-slate-400 font-medium">No metrics data available</p>
              <p className="text-sm text-slate-500 mt-2">
                Metrics will be collected as listeners engage with your station
              </p>
            </div>
          )}
        </div>
      </div>
    </ListenersLayout>
  );
}
