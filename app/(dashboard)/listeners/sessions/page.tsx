'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureGuard } from '@/components/feature-guard';
import { Feature } from '@/lib/features';

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

  useEffect(() => {
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

    if (session?.user?.organizationId) {
      fetchSessions();
    }
  }, [session]);

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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Listener Sessions</h1>
        <p className="text-muted-foreground">
          View all listener sessions and activity
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            Complete history of listener sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">
                        {session.city && session.country ? (
                          <>
                            {session.city}, {session.country}
                          </>
                        ) : session.country ? (
                          session.country
                        ) : (
                          <span className="text-muted-foreground">{session.ipAddress}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(session.startedAt).toLocaleDateString()} {new Date(session.startedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          Duration: {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                        </div>
                      </div>
                      {session.programName && (
                        <div className="text-sm mt-1">
                          Program: <span className="font-medium">{session.programName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 sm:text-right">
                    {session.endedAt ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        Ended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No listener sessions found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sessions will appear here as listeners engage with your station
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
