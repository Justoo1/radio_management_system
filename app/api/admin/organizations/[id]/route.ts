/**
 * Admin API: Get Organization Details
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json({ error: 'Unauthorized - Developer access required' }, { status: 401 })
    }

    // Await params in Next.js 15+
    const { id } = await params

    const organization = await prisma.organization.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        enabledFeatures: true,
        maxUsers: true,
        maxClients: true,
        maxSMSPerMonth: true,
        maxStorageGB: true,
        trialEndDate: true,
        createdAt: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
