/**
 * API Route: Get Listener Statistics
 * Returns overview stats for listener tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Feature, checkFeatureAccess } from '@/lib/features';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check listener tracking feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.LISTENER_TRACKING);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Listener tracking feature is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Get total sessions count
    const totalSessions = await prisma.listenerSession.count({
      where: { organizationId },
    });

    // Get active sessions (no endedAt)
    const activeSessions = await prisma.listenerSession.count({
      where: {
        organizationId,
        endedAt: null,
      },
    });

    // Get average duration
    const avgDuration = await prisma.listenerSession.aggregate({
      where: { organizationId },
      _avg: {
        durationSeconds: true,
      },
    });

    // Get total requests
    const totalRequests = await prisma.listenerRequest.count({
      where: { organizationId },
    });

    // Get top locations
    const sessionsWithLocation = await prisma.listenerSession.groupBy({
      where: {
        organizationId,
        country: {
          not: null,
        },
      },
      by: ['country'],
      _count: {
        country: true,
      },
      orderBy: {
        _count: {
          country: 'desc',
        },
      },
      take: 5,
    });

    const topLocations = sessionsWithLocation.map(s => ({
      country: s.country,
      count: s._count.country,
    }));

    // Get recent sessions
    const recentSessions = await prisma.listenerSession.findMany({
      where: { organizationId },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        country: true,
        city: true,
        startedAt: true,
        durationSeconds: true,
      },
    });

    return NextResponse.json({
      totalSessions,
      activeSessions,
      avgDurationMinutes: Math.round((avgDuration._avg.durationSeconds || 0) / 60),
      totalRequests,
      topLocations,
      recentSessions,
    });
  } catch (error) {
    console.error('Error fetching listener stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listener statistics' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
