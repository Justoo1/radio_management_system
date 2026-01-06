/**
 * Public Request API
 * Allows listeners to submit requests without authentication
 * Rate limited and validated
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerRequestEvent, PUSHER_EVENTS } from '@/lib/pusher/server';
import { notifyNewRequest } from '@/lib/push-notifications';
import { z } from 'zod';

// Request validation schema
const publicRequestSchema = z.object({
  organizationSlug: z.string().min(1, 'Organization is required'),
  listenerName: z.string().min(1, 'Name is required').max(100),
  listenerPhone: z.string().min(1, 'Phone number is required').max(20),
  listenerEmail: z.string().email().optional().or(z.literal('')),
  requestType: z.enum(['SONG_REQUEST', 'DEDICATION', 'SHOUTOUT', 'QUESTION', 'COMMENT', 'CONTEST_ENTRY']),
  songTitle: z.string().max(200).optional(),
  songArtist: z.string().max(200).optional(),
  message: z.string().max(500, 'Message too long').optional(),
});

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
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

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = publicRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Find organization by slug
    const organization = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
      select: {
        id: true,
        name: true,
        status: true,
        enabledFeatures: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      );
    }

    // Check if organization is active
    if (organization.status !== 'ACTIVE' && organization.status !== 'TRIAL') {
      return NextResponse.json(
        { error: 'This station is currently not accepting requests' },
        { status: 403 }
      );
    }

    // Check if listener tracking feature is enabled
    const enabledFeatures = (organization.enabledFeatures as unknown as string[]) || [];
    if (!enabledFeatures.includes('listener_tracking')) {
      return NextResponse.json(
        { error: 'This station is not accepting online requests at this time' },
        { status: 403 }
      );
    }

    // Create the listener request
    const listenerRequest = await prisma.listenerRequest.create({
      data: {
        organizationId: organization.id,
        listenerName: data.listenerName,
        listenerPhone: data.listenerPhone,
        listenerEmail: data.listenerEmail || null,
        requestType: data.requestType,
        songTitle: data.songTitle || null,
        songArtist: data.songArtist || null,
        message: data.message || null,
        status: 'PENDING',
        source: 'WEBSITE',
      },
    });

    // Trigger real-time event
    await triggerRequestEvent(organization.id, PUSHER_EVENTS.REQUEST_NEW, {
      request: {
        id: listenerRequest.id,
        listenerName: listenerRequest.listenerName,
        listenerPhone: listenerRequest.listenerPhone,
        listenerEmail: listenerRequest.listenerEmail,
        requestType: listenerRequest.requestType,
        songTitle: listenerRequest.songTitle,
        songArtist: listenerRequest.songArtist,
        message: listenerRequest.message,
        status: listenerRequest.status,
        source: listenerRequest.source,
        createdAt: listenerRequest.createdAt.toISOString(),
      },
    });

    // Send push notification to staff
    await notifyNewRequest(organization.id, {
      listenerName: listenerRequest.listenerName || undefined,
      requestType: listenerRequest.requestType,
      songTitle: listenerRequest.songTitle || undefined,
      message: listenerRequest.message || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Your request has been submitted!',
      requestId: listenerRequest.id,
    });
  } catch (error) {
    console.error('Error creating public request:', error);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const dynamic = 'force-dynamic';
