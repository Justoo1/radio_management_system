/**
 * Cron Job Endpoint - Check Subscription Payments
 * Can be called by external services like vercel/cron or similar
 * Run this daily to check overdue payments and update organization status
 *
 * Flow:
 * 1. Find ACTIVE subscriptions with expired nextPaymentDate
 * 2. Give 3-day grace period before suspending
 * 3. On suspension: set org to SUSPENDED, clear premium features
 * 4. After 7 more days: set to EXPIRED (10 days total)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'

export const maxDuration = 60 // Timeout after 60 seconds

// Verify cron secret from environment
const CRON_SECRET = process.env.CRON_SECRET

// Grace period before suspension (days)
const GRACE_PERIOD_DAYS = 3
// Days after suspension before full expiration
const EXPIRATION_AFTER_SUSPENSION_DAYS = 7

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
    const gracePeriodDate = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
    const expirationDate = new Date(now.getTime() - (GRACE_PERIOD_DAYS + EXPIRATION_AFTER_SUSPENSION_DAYS) * 24 * 60 * 60 * 1000)

    const results = {
      warningsSent: 0,
      suspendedCount: 0,
      expiredCount: 0,
      suspendedOrganizations: [] as any[],
      expiredOrganizations: [] as any[],
    }

    // 1. Find ACTIVE subscriptions approaching payment due (send warning)
    const approachingDue = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          not: null,
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // Within next 3 days
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    })

    // Send payment reminder emails
    for (const subscription of approachingDue) {
      if (subscription.organization && subscription.plan) {
        try {
          const daysUntilDue = Math.ceil(
            (subscription.nextPaymentDate!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          )

          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: subscription.organization.email,
            subject: `Payment due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`,
            html: `
              <h1>Payment Reminder</h1>
              <p>Hi ${subscription.organization.name},</p>
              <p>Your subscription payment of <strong>${subscription.plan.currency} ${subscription.plan.price}</strong> for the ${subscription.plan.name} plan is due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}.</p>
              <p>Please make your payment to continue enjoying all features.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/settings/billing">Make Payment</a></p>
              <p>Best regards,<br>Radio Management System Team</p>
            `,
          })
          results.warningsSent++
        } catch (error) {
          console.error(`Failed to send payment reminder to ${subscription.organization.name}:`, error)
        }
      }
    }

    // 2. Find ACTIVE subscriptions past grace period - SUSPEND them
    const pastGracePeriod = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          not: null,
          lte: gracePeriodDate, // Past grace period
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    })

    for (const subscription of pastGracePeriod) {
      if (subscription.organization && subscription.plan) {
        // Update subscription to PAST_DUE
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        })

        // Suspend organization and clear premium features (keep core features)
        await prisma.organization.update({
          where: { id: subscription.organization.id },
          data: {
            status: 'SUSPENDED',
            // Clear all premium features - they'll need to pay to restore
            enabledFeatures: JSON.stringify([]),
          },
        })

        results.suspendedCount++
        results.suspendedOrganizations.push({
          id: subscription.organization.id,
          name: subscription.organization.name,
          planName: subscription.plan.name,
          nextPaymentDate: subscription.nextPaymentDate,
          amount: subscription.plan.price,
        })

        // Send suspension email
        try {
          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: subscription.organization.email,
            subject: 'Account Suspended - Payment Required',
            html: `
              <h1>Account Suspended</h1>
              <p>Hi ${subscription.organization.name},</p>
              <p>Your account has been suspended due to an overdue payment.</p>
              <p>Your subscription payment of <strong>${subscription.plan.currency} ${subscription.plan.price}</strong> was due on ${subscription.nextPaymentDate?.toLocaleDateString()}.</p>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Premium features are now disabled</li>
                <li>You can still access basic features</li>
                <li>Your data is safe and preserved</li>
              </ul>
              <p>Please make your payment within 7 days to restore full access and prevent permanent suspension.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/upgrade">Make Payment Now</a></p>
              <p>Best regards,<br>Radio Management System Team</p>
            `,
          })
        } catch (error) {
          console.error(`Failed to send suspension email to ${subscription.organization.name}:`, error)
        }
      }
    }

    // 3. Find PAST_DUE subscriptions past expiration period - EXPIRE them
    const pastExpiration = await prisma.subscription.findMany({
      where: {
        status: 'PAST_DUE',
        nextPaymentDate: {
          not: null,
          lte: expirationDate, // Past full expiration period
        },
      },
      include: {
        organization: true,
        plan: true,
      },
    })

    for (const subscription of pastExpiration) {
      if (subscription.organization) {
        // Update subscription to EXPIRED
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'EXPIRED',
          },
        })

        // Expire organization
        await prisma.organization.update({
          where: { id: subscription.organization.id },
          data: {
            status: 'EXPIRED',
          },
        })

        results.expiredCount++
        results.expiredOrganizations.push({
          id: subscription.organization.id,
          name: subscription.organization.name,
          planName: subscription.plan?.name,
          nextPaymentDate: subscription.nextPaymentDate,
        })

        // Send expiration email
        try {
          await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: subscription.organization.email,
            subject: 'Account Expired',
            html: `
              <h1>Account Expired</h1>
              <p>Hi ${subscription.organization.name},</p>
              <p>Your account has expired due to non-payment.</p>
              <p>Your data is still preserved. To reactivate your account, please subscribe to a plan.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/upgrade">Reactivate Account</a></p>
              <p>Best regards,<br>Radio Management System Team</p>
            `,
          })
        } catch (error) {
          console.error(`Failed to send expiration email to ${subscription.organization.name}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        warningsSent: results.warningsSent,
        suspendedCount: results.suspendedCount,
        expiredCount: results.expiredCount,
      },
      suspendedOrganizations: results.suspendedOrganizations,
      expiredOrganizations: results.expiredOrganizations,
      message: `Sent ${results.warningsSent} warnings, suspended ${results.suspendedCount} orgs, expired ${results.expiredCount} orgs.`,
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
