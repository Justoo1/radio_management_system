import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { approveListenerRequest, rejectListenerRequest } from '@/lib/services/onair';
import { triggerRequestEvent, PUSHER_EVENTS } from '@/lib/pusher/server';

// Helper function to record request metrics
async function recordRequestMetric(
  organizationId: string,
  requestType: string,
  status: 'APPROVED' | 'REJECTED',
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
        songRequests: status === 'APPROVED' ? { increment: 1 } : undefined,
      },
      create: {
        organizationId,
        timestamp: hourStart,
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        songRequests: status === 'APPROVED' ? 1 : 0,
        programId: programId || undefined,
      },
    });

    // Also record in the general Metric table for reports
    await prisma.metric.create({
      data: {
        organizationId,
        metricType: status === 'APPROVED' ? 'LISTENER_REQUEST_APPROVED' : 'LISTENER_REQUEST_REJECTED',
        metricName: `Listener Request ${status.toLowerCase()}`,
        value: 1,
        recordedDate: now,
        metadata: JSON.stringify({
          requestType,
          programId,
          timestamp: now.toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error('Failed to record request metric:', error);
    // Don't throw - metrics shouldn't break the main flow
  }
}

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
    const organizationId = session.user.organizationId;

    // Fetch the request first to get details for metrics
    const request = await prisma.listenerRequest.findUnique({
      where: { id },
      select: { requestType: true, programId: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    let result;
    if (status === 'APPROVED') {
      result = await approveListenerRequest(id);
      // Record metric for operational reports
      await recordRequestMetric(organizationId, request.requestType, 'APPROVED', request.programId);
      // Trigger real-time event
      await triggerRequestEvent(organizationId, PUSHER_EVENTS.REQUEST_APPROVED, {
        requestId: id,
        status: 'APPROVED',
      });
    } else if (status === 'REJECTED') {
      result = await rejectListenerRequest(id);
      // Record metric for operational reports
      await recordRequestMetric(organizationId, request.requestType, 'REJECTED', request.programId);
      // Trigger real-time event
      await triggerRequestEvent(organizationId, PUSHER_EVENTS.REQUEST_REJECTED, {
        requestId: id,
        status: 'REJECTED',
      });
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
