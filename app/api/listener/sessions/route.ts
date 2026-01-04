/**
 * API Route: Get Listener Sessions
 * Returns all listener sessions for the organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get URL params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await prisma.listenerSession.findMany({
      where: { organizationId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform data for frontend
    const transformedSessions = sessions.map(s => ({
      id: s.id,
      sessionId: s.sessionId,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      country: s.country,
      city: s.city,
      latitude: s.latitude,
      longitude: s.longitude,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSeconds: s.durationSeconds,
      programId: s.programId,
      programName: s.program?.name,
    }));

    return NextResponse.json(transformedSessions);
  } catch (error) {
    console.error('Error fetching listener sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listener sessions' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
