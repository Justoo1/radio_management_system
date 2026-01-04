'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Feature, isFeatureEnabled, parseEnabledFeatures } from '@/lib/features';
import { hasReportAccess } from '@/lib/subscription-access';
import { useOrganizationStore } from '@/store/organization.store';

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

export default function ListenerMetrics() {
  const { data: session } = useSession();
  const { organization, subscription } = useOrganizationStore();
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

  // Check feature access
  const enabledFeatures = organization?.enabledFeatures
    ? parseEnabledFeatures(organization.enabledFeatures)
    : [];
  const hasFeature = isFeatureEnabled(enabledFeatures, Feature.LISTENER_TRACKING);
  const hasPlanAccess = hasReportAccess(subscription?.plan?.name || subscription?.planName, 'listener-tracking');

  if (!hasFeature || !hasPlanAccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Listener Tracking Not Available</h2>
          <p className="text-muted-foreground mb-4">
            {!hasPlanAccess
              ? 'Upgrade to Professional plan to access listener tracking features.'
              : 'This feature is not enabled for your organization. Contact support to enable it.'}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Calculate summary stats
  const totalSessions = metrics.reduce((sum, m) => sum + m.totalSessions, 0);
  const avgListeners = metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.currentListeners, 0) / metrics.length)
    : 0;
  const peakListeners = Math.max(...metrics.map(m => m.peakListeners), 0);
  const totalEngagement = metrics.reduce((sum, m) =>
    sum + m.songRequests + m.whatsappMessages + m.smsMessages, 0
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Listener Metrics</h1>
        <p className="text-muted-foreground">
          Detailed analytics and engagement metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">Across all time periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Listeners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgListeners}</div>
            <p className="text-xs text-muted-foreground">Average concurrent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Listeners</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakListeners}</div>
            <p className="text-xs text-muted-foreground">Highest recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement}</div>
            <p className="text-xs text-muted-foreground">Requests & messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics List */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Metrics</CardTitle>
          <CardDescription>
            Listener activity broken down by hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.length > 0 ? (
            <div className="space-y-4">
              {metrics.slice(0, 10).map((metric, index) => (
                <div key={index} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">
                        {new Date(metric.timestamp).toLocaleDateString()} - Hour {metric.hour}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Day {metric.dayOfWeek} of week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{metric.totalSessions} sessions</p>
                      <p className="text-xs text-muted-foreground">Peak: {metric.peakListeners}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Duration</p>
                      <p className="font-medium">{Math.floor(metric.avgDuration / 60)}m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Song Requests</p>
                      <p className="font-medium">{metric.songRequests}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Messages</p>
                      <p className="font-medium">
                        {metric.whatsappMessages + metric.smsMessages}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No metrics data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Metrics will be collected as listeners engage with your station
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
