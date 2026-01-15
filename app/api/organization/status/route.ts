/**
 * Organization Status API
 * Get current organization's payment account and feature status
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        hasPaymentAccount: true,
        trialEndDate: true,
        streamingConfig: {
          select: {
            azuracastStationId: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        hasPaymentAccount: organization.hasPaymentAccount,
        hasStreamingConfig: !!organization.streamingConfig?.azuracastStationId,
        status: organization.status,
        trialEndDate: organization.trialEndDate,
      },
    })
  } catch (error) {
    console.error('Error fetching organization status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization status' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
