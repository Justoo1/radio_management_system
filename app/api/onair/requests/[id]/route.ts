import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { approveListenerRequest, rejectListenerRequest } from '@/lib/services/onair';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    let result;
    if (status === 'APPROVED') {
      result = await approveListenerRequest(id);
    } else if (status === 'REJECTED') {
      result = await rejectListenerRequest(id);
    } else {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
