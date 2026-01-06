import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getCurrentlyPlaying,
  startPlaying,
  skipCurrentlyPlaying,
} from '@/lib/services/onair';
import { triggerOnAirEvent, PUSHER_EVENTS } from '@/lib/pusher/server';

export async function GET(req: NextRequest) {
  try {
    // Get organization ID from request headers (passed from client)
    let organizationId: string | null = req.headers.get('x-organization-id');

    if (!organizationId) {
      // Fall back to auth if no org ID header
      try {
        const session = await Promise.race([
          auth(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
        ]) as any;

        if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        organizationId = session.user.organizationId;
      } catch (authError) {
        console.error('[OnAir Now GET] Auth error:', authError);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add timeout to database query
    const nowPlaying = await Promise.race([
      getCurrentlyPlaying(organizationId as string),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 8000))
    ]) as any;

    return NextResponse.json(nowPlaying || null);
  } catch (error: any) {
    console.error('[OnAir Now GET] Error:', error);

    // Return null instead of error for timeouts to allow graceful degradation
    if (error.message?.includes('timeout')) {
      return NextResponse.json(null);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch now playing' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, id: userId } = session.user as any;
    const body = await req.json();

    const nowPlaying = await startPlaying(organizationId, {
      ...body,
      presenterId: userId,
    });

    // Trigger Pusher event for real-time update
    await triggerOnAirEvent(organizationId, PUSHER_EVENTS.NOW_PLAYING_UPDATED, {
      id: nowPlaying.id,
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      duration: nowPlaying.duration,
      remainingSeconds: nowPlaying.remainingSeconds,
      startedAt: nowPlaying.startedAt,
      endsAt: nowPlaying.endsAt,
      thumbnailUrl: nowPlaying.thumbnailUrl,
      itemType: nowPlaying.itemType,
      programId: nowPlaying.programId,
    });

    return NextResponse.json(nowPlaying);
  } catch (error: any) {
    console.error('Error starting playback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start playback' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;

    await skipCurrentlyPlaying(organizationId);

    // Trigger Pusher event for real-time update
    await triggerOnAirEvent(organizationId, PUSHER_EVENTS.NOW_PLAYING_ENDED, {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error skipping:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to skip' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10; // Maximum execution time in seconds
