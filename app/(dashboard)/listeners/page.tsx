'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, Users, TrendingUp, Clock, Phone, MessageSquare, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Feature, isFeatureEnabled, parseEnabledFeatures } from '@/lib/features';
import { hasReportAccess } from '@/lib/subscription-access';
import { useOrganizationStore } from '@/store/organization.store';

interface ListenerStats {
  totalSessions: number;
  activeSessions: number;
  avgDurationMinutes: number;
  totalRequests: number;
  topLocations: Array<{ country: string; count: number }>;
  recentSessions: Array<{
    id: string;
    ipAddress: string;
    country?: string;
    city?: string;
    startedAt: string;
    durationSeconds: number;
  }>;
}

export default function ListenersOverview() {
  const { data: session } = useSession();
  const { organization, subscription } = useOrganizationStore();
  const [stats, setStats] = useState<ListenerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/listener/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching listener stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.organizationId) {
      fetchStats();
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

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Listener Tracking</h1>
        <p className="text-muted-foreground">
          Monitor and analyze your listener engagement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently listening</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgDurationMinutes || 0}m</div>
            <p className="text-xs text-muted-foreground">Per session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Songs & messages</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>Where your listeners are from</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.topLocations && stats.topLocations.length > 0 ? (
              <div className="space-y-3">
                {stats.topLocations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{location.country || 'Unknown'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{location.count} sessions</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No location data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Latest listener activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentSessions && stats.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {session.city && session.country
                          ? `${session.city}, ${session.country}`
                          : session.country || session.ipAddress}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent sessions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Call to Action for Traditional Radio Stations */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Traditional FM Radio Station?
          </CardTitle>
          <CardDescription>
            Track listener engagement beyond streaming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            Our listener tracking works for traditional FM broadcasters too! Track engagement through:
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Call-in requests and dedications</li>
            <li>SMS interactions</li>
            <li>WhatsApp messages</li>
            <li>Social media mentions</li>
            <li>Contest participation</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
