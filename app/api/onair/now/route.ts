import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getCurrentlyPlaying,
  startPlaying,
  skipCurrentlyPlaying,
} from '@/lib/services/onair';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;

    const nowPlaying = await getCurrentlyPlaying(organizationId);

    return NextResponse.json(nowPlaying);
  } catch (error: any) {
    console.error('Error fetching now playing:', error);
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

    return NextResponse.json(nowPlaying);
  } catch (error: any) {
    console.error('Error starting playback:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start playback' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = session.user as any;

    await skipCurrentlyPlaying(organizationId);

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
