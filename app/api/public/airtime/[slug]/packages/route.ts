/**
 * Public API: Airtime Packages
 * Returns available airtime packages for a station
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find organization by slug
    const organization = await prisma.organization.findFirst({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        streamingConfig: {
          select: {
            id: true,
            streamName: true,
            isEnabled: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    // Check if streaming is enabled
    if (!organization.streamingConfig?.isEnabled) {
      return NextResponse.json(
        { error: 'Streaming is not enabled for this station' },
        { status: 403 }
      )
    }

    // Get active airtime packages
    const packages = await prisma.airtimePackage.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
        currency: true,
        sortOrder: true,
        allowedDays: true,
        allowedHoursStart: true,
        allowedHoursEnd: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { durationMinutes: 'asc' },
      ],
    })

    // Parse allowedDays JSON
    const formattedPackages = packages.map((pkg) => ({
      ...pkg,
      price: Number(pkg.price),
      allowedDays: pkg.allowedDays ? JSON.parse(pkg.allowedDays) : null,
    }))

    return NextResponse.json({
      station: {
        name: organization.streamingConfig?.streamName || organization.name,
        logo: organization.logo,
        slug: organization.slug,
      },
      packages: formattedPackages,
    })
  } catch (error) {
    console.error('Error fetching airtime packages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
