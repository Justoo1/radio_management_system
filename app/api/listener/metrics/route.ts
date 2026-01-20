/**
 * API Route: Get Listener Metrics
 * Returns aggregated metrics for listener analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Feature, checkFeatureAccess } from '@/lib/features';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check listener tracking feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.LISTENER_TRACKING);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Listener tracking feature is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Get URL params
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const metrics = await prisma.listenerMetrics.findMany({
      where: { organizationId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching listener metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listener metrics' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
