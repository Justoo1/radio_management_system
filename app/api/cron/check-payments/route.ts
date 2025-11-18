/**
 * Cron Job Endpoint - Check Subscription Payments
 * Can be called by external services like vercel/cron or similar
 * Run this daily to check overdue payments and update organization status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60 // Timeout after 60 seconds

// Verify cron secret from environment
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  try {
    // Verify the request has the correct secret
    const authHeader = req.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find all ACTIVE subscriptions with a next payment date
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          not: null,
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    })

    let pastDueCount = 0
    const pastDueOrganizations = []

    // Check each subscription for payment status
    for (const subscription of activeSubscriptions) {
      // If next payment date has passed, mark as PAST_DUE
      if (
        subscription.nextPaymentDate &&
        subscription.nextPaymentDate <= now &&
        subscription.organization &&
        subscription.plan
      ) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        })

        // Update organization status to SUSPENDED
        await prisma.organization.update({
          where: { id: subscription.organization.id },
          data: {
            status: 'SUSPENDED',
          },
        })

        pastDueCount++
        pastDueOrganizations.push({
          id: subscription.organization.id,
          name: subscription.organization.name,
          planName: subscription.plan.name,
          nextPaymentDate: subscription.nextPaymentDate,
          amount: subscription.plan.price,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalActiveSubscriptions: activeSubscriptions.length,
      pastDueCount,
      pastDueOrganizations,
      message: `Checked ${activeSubscriptions.length} active subscriptions. ${pastDueCount} are now past due.`,
    })
  } catch (error) {
    console.error('Error in check-payments cron:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
