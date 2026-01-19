/**
 * Cron Job Endpoint - Check Trial Periods
 * Can be called by external services like vercel/cron or similar
 * Run this daily to check expired trials and update organization status
 * OPTIMIZED: Uses batch updates instead of individual updates
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

    // Find all trial organizations with expired trials
    const expiredTrialOrgs = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          lte: now,
        },
      },
      select: {
        id: true,
        name: true,
        trialEndDate: true,
        subscriptionId: true,
      },
    })

    if (expiredTrialOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        timestamp: now.toISOString(),
        totalTrialOrganizations: 0,
        expiredCount: 0,
        expiredOrganizations: [],
        message: 'No expired trials found.',
      })
    }

    // Get organization IDs and subscription IDs
    const expiredOrgIds = expiredTrialOrgs.map((org) => org.id)
    const expiredSubIds = expiredTrialOrgs
      .filter((org) => org.subscriptionId)
      .map((org) => org.subscriptionId!)

    // OPTIMIZED: Batch update all expired organizations in a single query
    const [orgUpdateResult, subUpdateResult] = await Promise.all([
      // Batch update organizations
      prisma.organization.updateMany({
        where: {
          id: { in: expiredOrgIds },
        },
        data: {
          status: 'EXPIRED',
          isTrialUsed: true,
        },
      }),

      // Batch update subscriptions (if any)
      expiredSubIds.length > 0
        ? prisma.subscription.updateMany({
            where: {
              id: { in: expiredSubIds },
            },
            data: {
              status: 'EXPIRED',
            },
          })
        : Promise.resolve({ count: 0 }),
    ])

    // Format response
    const expiredOrganizations = expiredTrialOrgs.map((org) => ({
      id: org.id,
      name: org.name,
      trialEndDate: org.trialEndDate,
    }))

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalTrialOrganizations: expiredTrialOrgs.length,
      expiredCount: orgUpdateResult.count,
      subscriptionsExpired: subUpdateResult.count,
      expiredOrganizations,
      message: `Updated ${orgUpdateResult.count} expired trial organizations and ${subUpdateResult.count} subscriptions.`,
    })
  } catch (error) {
    console.error('Error in check-trials cron:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for external cron services that prefer POST
export async function POST(req: NextRequest) {
  return GET(req)
}
