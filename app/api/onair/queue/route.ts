import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getQueue,
  addToQueue,
  updateQueuePositions,
  removeFromQueue,
  playNextInQueue,
} from '@/lib/services/onair';

export async function GET(req: NextRequest) {
  try {
    // Get organization ID from headers first (faster, no auth call)
    let organizationId: string | null = req.headers.get('x-organization-id');

    if (!organizationId) {
      // Fall back to auth if no header
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      organizationId = (session.user as any).organizationId;
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queue = await getQueue(organizationId);

    return NextResponse.json(queue);
  } catch (error: any) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
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

    const { organizationId } = session.user as any;
    const body = await req.json();

    const { action, ...data } = body;

    if (action === 'add') {
      const queueItem = await addToQueue(organizationId, data);
      return NextResponse.json(queueItem);
    } else if (action === 'reorder') {
      await updateQueuePositions(organizationId, data.items);
      return NextResponse.json({ success: true });
    } else if (action === 'playNext') {
      const { id: userId } = session.user as any;
      const nowPlaying = await playNextInQueue(organizationId, userId);
      return NextResponse.json(nowPlaying);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update queue' },
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
    const { searchParams } = new URL(req.url);
    const queueItemId = searchParams.get('id');

    if (!queueItemId) {
      return NextResponse.json(
        { error: 'Queue item ID is required' },
        { status: 400 }
      );
    }

    await removeFromQueue(organizationId, queueItemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing from queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from queue' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
