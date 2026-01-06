/**
 * API Route: Start Program Broadcasting
 * Marks a program as currently on-air
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { startProgram } from '@/lib/services/onair';
import { triggerOnAirEvent, PUSHER_EVENTS } from '@/lib/pusher/server';

/**
 * POST /api/onair/program/start
 * Start broadcasting a program
 */
export async function POST(req: NextRequest) {
  try {
    // Add timeout to auth check
    const session = await Promise.race([
      auth(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000))
    ]) as any;

    if (!session?.user?.organizationId || !session?.user?.id) {
      console.error('[OnAir Start] Unauthorized: Missing session or organizationId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { programId, duration } = body;

    if (!programId) {
      console.error('[OnAir Start] Bad request: Missing programId');
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    console.log('[OnAir Start] Starting program:', {
      programId,
      duration,
      organizationId: session.user.organizationId,
      userId: session.user.id,
    });

    // Start the program with timeout
    const onAir = await Promise.race([
      startProgram(
        session.user.organizationId,
        programId,
        session.user.id,
        duration
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Start program timeout')), 8000))
    ]) as any;

    console.log('[OnAir Start] Program started successfully:', onAir.id);

    // Trigger Pusher event for real-time update
    await triggerOnAirEvent(session.user.organizationId, PUSHER_EVENTS.PROGRAM_STARTED, {
      id: onAir.id,
      title: onAir.title,
      artist: onAir.artist,
      duration: onAir.duration,
      remainingSeconds: onAir.remainingSeconds,
      startedAt: onAir.startedAt,
      endsAt: onAir.endsAt,
      thumbnailUrl: onAir.thumbnailUrl,
      itemType: onAir.itemType,
      programId: onAir.programId,
    });

    return NextResponse.json({ success: true, onAir });
  } catch (error) {
    console.error('[OnAir Start] Error starting program:', error);

    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to start program',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 10;
