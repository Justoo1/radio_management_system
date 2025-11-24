/**
 * API Route: Add Program to Queue
 * Adds a program to the broadcast queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addProgramToQueue } from '@/lib/services/onair';

/**
 * POST /api/onair/program/queue
 * Add a program to the queue
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { programId, position, scheduledTime } = body;

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    if (typeof position !== 'number' || position < 1) {
      return NextResponse.json(
        { error: 'Valid position is required' },
        { status: 400 }
      );
    }

    // Add program to queue
    const queueItem = await addProgramToQueue(
      session.user.organizationId,
      programId,
      position,
      scheduledTime ? new Date(scheduledTime) : undefined
    );

    return NextResponse.json({ success: true, queueItem });
  } catch (error) {
    console.error('Error adding program to queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add program to queue' },
      { status: 500 }
    );
  }
}
