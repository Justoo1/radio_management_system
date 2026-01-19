/**
 * Organization Status API
 * Get current organization's payment account, feature status, and subscription details
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseEnabledFeatures } from '@/lib/features'

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
        subscriptionId: true,
        enabledFeatures: true,
        maxUsers: true,
        maxClients: true,
        maxSMSPerMonth: true,
        maxStorageGB: true,
        maxPrograms: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            nextPaymentDate: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
              },
            },
          },
        },
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

    // Check if subscription is active
    const hasActiveSubscription =
      organization.subscriptionId &&
      organization.subscription?.status === 'ACTIVE'

    // Parse enabled features
    const enabledFeatures = parseEnabledFeatures(organization.enabledFeatures)

    return NextResponse.json({
      success: true,
      data: {
        hasPaymentAccount: organization.hasPaymentAccount,
        hasStreamingConfig: !!organization.streamingConfig?.azuracastStationId,
        status: organization.status,
        trialEndDate: organization.trialEndDate,
        subscriptionId: organization.subscriptionId,
        subscriptionStatus: organization.subscription?.status,
        hasActiveSubscription,
        // New fields for feature checking
        enabledFeatures,
        plan: organization.subscription?.plan || null,
        currentPeriodEnd: organization.subscription?.currentPeriodEnd,
        nextPaymentDate: organization.subscription?.nextPaymentDate,
        // Plan limits
        limits: {
          maxUsers: organization.maxUsers,
          maxClients: organization.maxClients,
          maxSMSPerMonth: organization.maxSMSPerMonth,
          maxStorageGB: organization.maxStorageGB,
          maxPrograms: organization.maxPrograms,
        },
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
