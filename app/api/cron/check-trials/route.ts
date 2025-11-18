/**
 * Cron Job Endpoint - Check Trial Periods
 * Can be called by external services like vercel/cron or similar
 * Run this daily to check expired trials and update organization status
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

    // Find all organizations with TRIAL status
    const trialOrganizations = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
      },
      include: {
        subscription: true,
      },
    })

    let expiredCount = 0
    const expiredOrganizations = []

    // Update each organization's status based on trial end date
    for (const org of trialOrganizations) {
      if (org.trialEndDate <= now) {
        // Trial has expired, change status to EXPIRED
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            status: 'EXPIRED',
            isTrialUsed: true,
          },
        })

        // If subscription exists, mark it as expired
        if (org.subscription) {
          await prisma.subscription.update({
            where: { id: org.subscription.id },
            data: {
              status: 'EXPIRED',
            },
          })
        }

        expiredCount++
        expiredOrganizations.push({
          id: org.id,
          name: org.name,
          trialEndDate: org.trialEndDate,
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalTrialOrganizations: trialOrganizations.length,
      expiredCount,
      expiredOrganizations,
      message: `Checked ${trialOrganizations.length} trial organizations. ${expiredCount} trials expired.`,
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
