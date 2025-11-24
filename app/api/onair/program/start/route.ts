/**
 * API Route: Start Program Broadcasting
 * Marks a program as currently on-air
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { startProgram } from '@/lib/services/onair';

/**
 * POST /api/onair/program/start
 * Start broadcasting a program
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { programId, duration } = body;

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Start the program (use current user as presenter)
    const onAir = await startProgram(
      session.user.organizationId,
      programId,
      session.user.id,
      duration // Pass the duration from the schedule
    );

    return NextResponse.json({ success: true, onAir });
  } catch (error) {
    console.error('Error starting program:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start program' },
      { status: 500 }
    );
  }
}
