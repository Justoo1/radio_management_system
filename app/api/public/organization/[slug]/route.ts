/**
 * Public Organization Info API
 * Returns basic organization info for public listener pages
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: {
        name: true,
        slug: true,
        logo: true,
        status: true,
        enabledFeatures: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization is active and accepting requests
    if (organization.status !== 'ACTIVE' && organization.status !== 'TRIAL') {
      return NextResponse.json(
        { error: 'This station is not currently active' },
        { status: 403 }
      );
    }

    // Check if listener tracking is enabled
    const enabledFeatures = (organization.enabledFeatures as unknown as string[]) || [];
    if (!enabledFeatures.includes('listener_tracking')) {
      return NextResponse.json(
        { error: 'This station is not accepting online requests' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization information' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
