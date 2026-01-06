/**
 * Public Chat API
 * Allows listeners to send and receive chat messages without authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerChatEvent, PUSHER_EVENTS } from '@/lib/pusher/server';
import { notifyChatMessage } from '@/lib/push-notifications';
import { z } from 'zod';

// Message validation schema
const chatMessageSchema = z.object({
  organizationSlug: z.string().min(1, 'Organization is required'),
  senderName: z.string().min(1, 'Name is required').max(50),
  senderPhone: z.string().max(20).optional(),
  message: z.string().min(1, 'Message is required').max(300, 'Message too long (max 300 characters)'),
});

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // messages per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Send a chat message
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = chatMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
      select: {
        id: true,
        slug: true,
        status: true,
        enabledFeatures: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    if (organization.status !== 'ACTIVE' && organization.status !== 'TRIAL') {
      return NextResponse.json({ error: 'Station not accepting messages' }, { status: 403 });
    }

    const enabledFeatures = (organization.enabledFeatures as unknown as string[]) || [];
    if (!enabledFeatures.includes('listener_tracking')) {
      return NextResponse.json({ error: 'Chat not available' }, { status: 403 });
    }

    // Create the message
    const chatMessage = await prisma.listenerChatMessage.create({
      data: {
        organizationId: organization.id,
        senderName: data.senderName,
        senderPhone: data.senderPhone || null,
        message: data.message,
        status: 'VISIBLE',
        isFromStaff: false,
      },
    });

    // Trigger real-time event
    await triggerChatEvent(organization.slug, PUSHER_EVENTS.CHAT_MESSAGE, {
      id: chatMessage.id,
      senderName: chatMessage.senderName,
      message: chatMessage.message,
      isFromStaff: false,
      isPinned: false,
      createdAt: chatMessage.createdAt.toISOString(),
    });

    // Send push notification to staff
    await notifyChatMessage(organization.id, {
      senderName: chatMessage.senderName,
      message: chatMessage.message,
    });

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        senderName: chatMessage.senderName,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Get recent chat messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before'); // Cursor for pagination

    if (!slug) {
      return NextResponse.json({ error: 'Organization slug required' }, { status: 400 });
    }

    // Find organization
    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        enabledFeatures: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    if (organization.status !== 'ACTIVE' && organization.status !== 'TRIAL') {
      return NextResponse.json({ error: 'Station not available' }, { status: 403 });
    }

    const enabledFeatures = (organization.enabledFeatures as unknown as string[]) || [];
    if (!enabledFeatures.includes('listener_tracking')) {
      return NextResponse.json({ error: 'Chat not available' }, { status: 403 });
    }

    // Get messages
    const messages = await prisma.listenerChatMessage.findMany({
      where: {
        organizationId: organization.id,
        status: 'VISIBLE',
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        senderName: true,
        message: true,
        isFromStaff: true,
        isPinned: true,
        createdAt: true,
      },
    });

    // Get pinned messages separately
    const pinnedMessages = await prisma.listenerChatMessage.findMany({
      where: {
        organizationId: organization.id,
        status: 'VISIBLE',
        isPinned: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        senderName: true,
        message: true,
        isFromStaff: true,
        isPinned: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      pinned: pinnedMessages,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
