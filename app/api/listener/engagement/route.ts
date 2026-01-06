/**
 * Engagement Session API
 * For Traditional FM stations to track manual listener engagement
 * (phone calls, SMS, WhatsApp, social media, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { triggerListenerEvent, PUSHER_EVENTS } from '@/lib/pusher/server';
import { z } from 'zod';

// Schema for creating a new engagement session
const createSessionSchema = z.object({
  name: z.string().max(200).optional(),
  source: z.enum(['PHONE_CALL', 'SMS', 'WHATSAPP', 'WEBSITE', 'SOCIAL_MEDIA', 'MOBILE_APP', 'MIXED']),
  programId: z.string().optional(),
  listenerName: z.string().max(100).optional(),
  listenerPhone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
});

// Schema for updating engagement counts
const updateCountsSchema = z.object({
  phoneCallCount: z.number().int().min(0).optional(),
  smsCount: z.number().int().min(0).optional(),
  whatsappCount: z.number().int().min(0).optional(),
  socialMediaCount: z.number().int().min(0).optional(),
  websiteCount: z.number().int().min(0).optional(),
  mobileAppCount: z.number().int().min(0).optional(),
  otherCount: z.number().int().min(0).optional(),
  uniqueCallers: z.number().int().min(0).optional(),
  contestEntries: z.number().int().min(0).optional(),
  songRequests: z.number().int().min(0).optional(),
  dedications: z.number().int().min(0).optional(),
  shoutouts: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

// Helper to record engagement metrics
async function recordEngagementMetric(
  organizationId: string,
  session: {
    source: string;
    phoneCallCount: number;
    smsCount: number;
    whatsappCount: number;
    socialMediaCount: number;
    websiteCount: number;
    mobileAppCount: number;
    songRequests: number;
    programId?: string | null;
    durationSeconds?: number;
  }
) {
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);

  try {
    // Calculate totals - this represents "listener activity" for Traditional FM
    const totalEngagement =
      session.phoneCallCount +
      session.smsCount +
      session.whatsappCount +
      session.socialMediaCount +
      session.websiteCount +
      session.mobileAppCount;

    // First, get the current metrics to check peak
    const existingMetrics = await prisma.listenerMetrics.findUnique({
      where: {
        organizationId_timestamp: {
          organizationId,
          timestamp: hourStart,
        },
      },
    });

    // Calculate new peak (max of existing peak and this session's engagement)
    const newPeak = Math.max(existingMetrics?.peakListeners || 0, totalEngagement);

    // Calculate average duration (weighted average if existing)
    const existingSessions = existingMetrics?.totalSessions || 0;
    const existingAvgDuration = existingMetrics?.avgDuration || 0;
    const sessionDuration = session.durationSeconds || 0;
    const newAvgDuration = existingSessions > 0
      ? Math.round(((existingAvgDuration * existingSessions) + sessionDuration) / (existingSessions + 1))
      : sessionDuration;

    // Update listener metrics for this hour
    await prisma.listenerMetrics.upsert({
      where: {
        organizationId_timestamp: {
          organizationId,
          timestamp: hourStart,
        },
      },
      update: {
        smsMessages: { increment: session.smsCount },
        whatsappMessages: { increment: session.whatsappCount },
        songRequests: { increment: session.songRequests },
        totalSessions: { increment: 1 },
        // Update listener counts based on engagement
        currentListeners: { increment: totalEngagement },
        peakListeners: newPeak,
        avgDuration: newAvgDuration,
      },
      create: {
        organizationId,
        timestamp: hourStart,
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        smsMessages: session.smsCount,
        whatsappMessages: session.whatsappCount,
        songRequests: session.songRequests,
        totalSessions: 1,
        // Set initial listener counts
        currentListeners: totalEngagement,
        peakListeners: totalEngagement,
        avgDuration: sessionDuration,
        programId: session.programId || undefined,
      },
    });

    // Create detailed metric record
    await prisma.metric.create({
      data: {
        organizationId,
        metricType: 'LISTENER_SESSION_ENDED',
        metricName: `Engagement Session - ${session.source}`,
        value: totalEngagement,
        recordedDate: now,
        metadata: JSON.stringify({
          source: session.source,
          phoneCallCount: session.phoneCallCount,
          smsCount: session.smsCount,
          whatsappCount: session.whatsappCount,
          socialMediaCount: session.socialMediaCount,
          websiteCount: session.websiteCount,
          mobileAppCount: session.mobileAppCount,
          songRequests: session.songRequests,
          programId: session.programId,
          timestamp: now.toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error('Failed to record engagement metric:', error);
  }
}

// GET - List engagement sessions
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // ACTIVE, PAUSED, COMPLETED, all
    const programId = searchParams.get('programId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (programId) {
      where.programId = programId;
    }

    const [sessions, total] = await Promise.all([
      prisma.engagementSession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          program: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.engagementSession.count({ where }),
    ]);

    // Get active session count
    const activeCount = await prisma.engagementSession.count({
      where: {
        organizationId: session.user.organizationId,
        status: 'ACTIVE',
      },
    });

    // Get today's totals
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaySessions = await prisma.engagementSession.findMany({
      where: {
        organizationId: session.user.organizationId,
        startedAt: { gte: todayStart },
      },
      select: {
        phoneCallCount: true,
        smsCount: true,
        whatsappCount: true,
        socialMediaCount: true,
        websiteCount: true,
        mobileAppCount: true,
        songRequests: true,
        contestEntries: true,
      },
    });

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

    const todayTotals = todaySessions.reduce<TodayTotals>(
      (acc, s) => ({
        phoneCallCount: acc.phoneCallCount + s.phoneCallCount,
        smsCount: acc.smsCount + s.smsCount,
        whatsappCount: acc.whatsappCount + s.whatsappCount,
        socialMediaCount: acc.socialMediaCount + s.socialMediaCount,
        websiteCount: acc.websiteCount + s.websiteCount,
        mobileAppCount: acc.mobileAppCount + s.mobileAppCount,
        songRequests: acc.songRequests + s.songRequests,
        contestEntries: acc.contestEntries + s.contestEntries,
        totalEngagements:
          acc.totalEngagements +
          s.phoneCallCount +
          s.smsCount +
          s.whatsappCount +
          s.socialMediaCount +
          s.websiteCount +
          s.mobileAppCount,
      }),
      {
        phoneCallCount: 0,
        smsCount: 0,
        whatsappCount: 0,
        socialMediaCount: 0,
        websiteCount: 0,
        mobileAppCount: 0,
        songRequests: 0,
        contestEntries: 0,
        totalEngagements: 0,
      }
    );

    return NextResponse.json({
      sessions,
      total,
      activeCount,
      todayTotals,
    });
  } catch (error) {
    console.error('Error fetching engagement sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new engagement session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get organization slug for Pusher
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { slug: true },
    });

    // Create the session
    const engagementSession = await prisma.engagementSession.create({
      data: {
        organizationId: session.user.organizationId,
        name: data.name,
        source: data.source as any,
        programId: data.programId || undefined,
        listenerName: data.listenerName,
        listenerPhone: data.listenerPhone,
        notes: data.notes,
        createdById: session.user.id,
        status: 'ACTIVE',
      },
      include: {
        program: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Trigger real-time event
    if (organization) {
      await triggerListenerEvent(session.user.organizationId, PUSHER_EVENTS.SESSION_STARTED, {
        type: 'engagement',
        session: {
          id: engagementSession.id,
          name: engagementSession.name,
          source: engagementSession.source,
          status: engagementSession.status,
          startedAt: engagementSession.startedAt.toISOString(),
          program: engagementSession.program,
          createdBy: engagementSession.createdBy,
          phoneCallCount: 0,
          smsCount: 0,
          whatsappCount: 0,
          socialMediaCount: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: engagementSession,
    });
  } catch (error) {
    console.error('Error creating engagement session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// PATCH - Update engagement counts (increment or set)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, action = 'set', ...counts } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const validationResult = updateCountsSchema.safeParse(counts);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify session belongs to organization
    const existingSession = await prisma.engagementSession.findFirst({
      where: {
        id: sessionId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (existingSession.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Cannot update completed session' }, { status: 400 });
    }

    const data = validationResult.data;

    // Build update data based on action
    let updateData: any = {};

    if (action === 'increment') {
      // Increment mode - add to existing values
      Object.keys(data).forEach((key) => {
        if (key !== 'notes' && data[key as keyof typeof data] !== undefined) {
          updateData[key] = { increment: data[key as keyof typeof data] };
        }
      });
      if (data.notes) {
        updateData.notes = data.notes;
      }
    } else {
      // Set mode - replace values
      updateData = data;
    }

    // Update the session
    const updatedSession = await prisma.engagementSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        program: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Trigger real-time update
    await triggerListenerEvent(session.user.organizationId, 'engagement:updated', {
      session: {
        id: updatedSession.id,
        phoneCallCount: updatedSession.phoneCallCount,
        smsCount: updatedSession.smsCount,
        whatsappCount: updatedSession.whatsappCount,
        socialMediaCount: updatedSession.socialMediaCount,
        websiteCount: updatedSession.websiteCount,
        mobileAppCount: updatedSession.mobileAppCount,
        songRequests: updatedSession.songRequests,
        contestEntries: updatedSession.contestEntries,
        dedications: updatedSession.dedications,
        shoutouts: updatedSession.shoutouts,
        updatedAt: updatedSession.updatedAt.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error updating engagement session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// PUT - End/complete an engagement session
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, status = 'COMPLETED' } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    if (!['ACTIVE', 'PAUSED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify session belongs to organization
    const existingSession = await prisma.engagementSession.findFirst({
      where: {
        id: sessionId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const updateData: any = { status };

    // Set endedAt only when completing
    if (status === 'COMPLETED') {
      updateData.endedAt = new Date();
    }

    // Update the session
    const updatedSession = await prisma.engagementSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        program: {
          select: { id: true, name: true },
        },
      },
    });

    // Record metrics when session is completed
    if (status === 'COMPLETED') {
      // Calculate session duration in seconds
      const durationSeconds = Math.floor(
        (updatedSession.endedAt!.getTime() - existingSession.startedAt.getTime()) / 1000
      );

      await recordEngagementMetric(session.user.organizationId, {
        source: updatedSession.source,
        phoneCallCount: updatedSession.phoneCallCount,
        smsCount: updatedSession.smsCount,
        whatsappCount: updatedSession.whatsappCount,
        socialMediaCount: updatedSession.socialMediaCount,
        websiteCount: updatedSession.websiteCount,
        mobileAppCount: updatedSession.mobileAppCount,
        songRequests: updatedSession.songRequests,
        programId: updatedSession.programId,
        durationSeconds,
      });
    }

    // Trigger real-time event
    await triggerListenerEvent(session.user.organizationId, PUSHER_EVENTS.SESSION_ENDED, {
      type: 'engagement',
      sessionId: updatedSession.id,
      status: updatedSession.status,
      endedAt: updatedSession.endedAt?.toISOString(),
      totalEngagement:
        updatedSession.phoneCallCount +
        updatedSession.smsCount +
        updatedSession.whatsappCount +
        updatedSession.socialMediaCount +
        updatedSession.websiteCount +
        updatedSession.mobileAppCount,
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Error updating engagement session status:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an engagement session
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify session belongs to organization
    const existingSession = await prisma.engagementSession.findFirst({
      where: {
        id: sessionId,
        organizationId: session.user.organizationId,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    await prisma.engagementSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error) {
    console.error('Error deleting engagement session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
