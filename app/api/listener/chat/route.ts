/**
 * Listener Chat API (Dashboard)
 * For staff to view, moderate, and respond to chat messages
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { triggerChatEvent, PUSHER_EVENTS } from '@/lib/pusher/server';
import { z } from 'zod';

// Helper function to record chat engagement metrics
async function recordChatMetric(
  organizationId: string,
  isFromStaff: boolean,
  programId?: string | null
) {
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);

  try {
    // Upsert listener metrics for this hour
    await prisma.listenerMetrics.upsert({
      where: {
        organizationId_timestamp: {
          organizationId,
          timestamp: hourStart,
        },
      },
      update: {
        whatsappMessages: { increment: 1 },
      },
      create: {
        organizationId,
        timestamp: hourStart,
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        whatsappMessages: 1,
        programId: programId || undefined,
      },
    });

    // Also record in the general Metric table for detailed reports
    await prisma.metric.create({
      data: {
        organizationId,
        metricType: 'LISTENER_CHAT_MESSAGE',
        metricName: isFromStaff ? 'Staff Chat Message' : 'Listener Chat Message',
        value: 1,
        recordedDate: now,
        metadata: JSON.stringify({
          isFromStaff,
          programId,
          timestamp: now.toISOString(),
          hour: now.getHours(),
          dayOfWeek: now.getDay(),
        }),
      },
    });
  } catch (error) {
    console.error('Failed to record chat metric:', error);
    // Don't throw - metrics shouldn't break the main flow
  }
}

// Staff message schema
const staffMessageSchema = z.object({
  message: z.string().min(1).max(500),
});

// Get chat messages for dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const status = searchParams.get('status') || 'all'; // all, visible, hidden, flagged

    const where: any = {
      organizationId: session.user.organizationId,
    };

    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    const messages = await prisma.listenerChatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        moderatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get stats
    const stats = await prisma.listenerChatMessage.groupBy({
      by: ['status'],
      where: { organizationId: session.user.organizationId },
      _count: true,
    });

    const totalMessages = await prisma.listenerChatMessage.count({
      where: {
        organizationId: session.user.organizationId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      messages: messages.reverse(),
      stats: {
        total: stats.reduce((acc, s) => acc + s._count, 0),
        visible: stats.find(s => s.status === 'VISIBLE')?._count || 0,
        hidden: stats.find(s => s.status === 'HIDDEN')?._count || 0,
        flagged: stats.find(s => s.status === 'FLAGGED')?._count || 0,
        last24h: totalMessages,
      },
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Send message as staff
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = staffMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Get organization slug for Pusher
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { slug: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Create staff message
    const chatMessage = await prisma.listenerChatMessage.create({
      data: {
        organizationId: session.user.organizationId,
        senderName: session.user.name || 'Station',
        message: validationResult.data.message,
        status: 'VISIBLE',
        isFromStaff: true,
        moderatedById: session.user.id,
      },
    });

    // Trigger real-time event
    await triggerChatEvent(organization.slug, PUSHER_EVENTS.CHAT_STAFF_MESSAGE, {
      id: chatMessage.id,
      senderName: chatMessage.senderName,
      message: chatMessage.message,
      isFromStaff: true,
      isPinned: false,
      createdAt: chatMessage.createdAt.toISOString(),
    });

    // Record staff chat engagement metric
    await recordChatMetric(session.user.organizationId, true);

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error) {
    console.error('Error sending staff message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
