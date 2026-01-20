/**
 * Check Trial Expiration Cron Job
 * Runs daily to check for expiring/expired trials
 * Sends reminder emails and updates organization status
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'
import { TrialReminderEmail } from '@/emails/trial-reminder'
import { TrialExpiredEmail } from '@/emails/trial-expired'

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify cron secret with proper null check
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)

    let emailsSent = 0
    let organizationsExpired = 0

    // 1. Find trials expiring in 2 days (haven't been reminded yet)
    const expiringIn2Days = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          gte: now,
          lte: twoDaysFromNow,
        },
      },
    })

    for (const org of expiringIn2Days) {
      const daysRemaining = Math.ceil(
        (org.trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      if (daysRemaining === 2) {
        try {
          const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/upgrade`
          const formattedDate = org.trialEndDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })

          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: org.email,
            subject: `Your trial ends in ${daysRemaining} days`,
            react: TrialReminderEmail({
              organizationName: org.name,
              daysRemaining,
              trialEndDate: formattedDate,
              upgradeUrl,
            }),
          })

          emailsSent++
          console.log(`Sent 2-day reminder to ${org.name}`)
        } catch (error) {
          console.error(`Failed to send 2-day reminder to ${org.name}:`, error)
        }
      }
    }

    // 2. Find trials expiring in 1 day
    const expiringIn1Day = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          gte: now,
          lte: oneDayFromNow,
        },
      },
    })

    for (const org of expiringIn1Day) {
      const daysRemaining = Math.ceil(
        (org.trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      if (daysRemaining === 1) {
        try {
          const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/upgrade`
          const formattedDate = org.trialEndDate.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })

          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: org.email,
            subject: 'Your trial expires tomorrow!',
            react: TrialReminderEmail({
              organizationName: org.name,
              daysRemaining,
              trialEndDate: formattedDate,
              upgradeUrl,
            }),
          })

          emailsSent++
          console.log(`Sent 1-day reminder to ${org.name}`)
        } catch (error) {
          console.error(`Failed to send 1-day reminder to ${org.name}:`, error)
        }
      }
    }

    // 3. Find expired trials
    const expiredTrials = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          lte: now,
        },
      },
    })

    for (const org of expiredTrials) {
      try {
        // Update organization status to EXPIRED
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            status: 'EXPIRED',
          },
        })

        // Update subscription status
        if (org.subscriptionId) {
          await prisma.subscription.update({
            where: { id: org.subscriptionId },
            data: {
              status: 'EXPIRED',
            },
          })
        }

        // Send expiration email
        const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/upgrade`

        await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: org.email,
          subject: 'Your trial has expired',
          react: TrialExpiredEmail({
            organizationName: org.name,
            upgradeUrl,
          }),
        })

        organizationsExpired++
        emailsSent++
        console.log(`Expired trial for ${org.name}`)
      } catch (error) {
        console.error(`Failed to expire trial for ${org.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        emailsSent,
        organizationsExpired,
        expiringIn2Days: expiringIn2Days.length,
        expiringIn1Day: expiringIn1Day.length,
        expiredTrials: expiredTrials.length,
      },
    })
  } catch (error) {
    console.error('Trial expiration check failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to check trial expiration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
