/**
 * Subscription Payment Verification API
 * Verifies payment status with Paystack and activates subscription if payment succeeded
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaystackService } from '@/lib/integrations/paystack'
import { invalidateOrgCache } from '@/lib/cache'

/**
 * Get enabled features based on plan name
 * NOTE: Feature names must match the Feature enum values in lib/features.ts (lowercase)
 */
function getEnabledFeaturesForPlan(planName: string): string[] {
  if (planName === 'Enterprise') {
    return [
      'sms_campaigns',
      'advertisements',
      'media_library',
      'whatsapp_integration',
      'expenses',
      'advanced_analytics',
      'report_revenue',
      'report_contracts',
      'report_aging',
      'report_client_analytics',
      'report_program_analytics',
      'report_sms_analytics',
      'listener_tracking',
      'streaming',
      'airtime',
    ]
  } else if (planName === 'Professional') {
    return [
      'sms_campaigns',
      'advertisements',
      'media_library',
      'whatsapp_integration',
      'expenses',
      'advanced_analytics',
      'report_revenue',
      'report_contracts',
      'report_aging',
      'report_client_analytics',
      'report_program_analytics',
      'report_sms_analytics',
      'listener_tracking',
    ]
  } else if (planName === 'Starter') {
    return ['expenses']
  }
  return []
}

/**
 * Activate subscription and organization after successful payment
 */
async function activateSubscription(
  paymentId: string,
  subscriptionId: string,
  organizationId: string,
  plan: { name: string; maxUsers: number; maxClients: number; maxSMSPerMonth: number; maxStorageGB: number; maxPrograms: number }
) {
  // Update payment status
  await prisma.subscriptionPayment.update({
    where: { id: paymentId },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
    },
  })

  // Update subscription status
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      lastPaymentDate: new Date(),
      nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  // Get enabled features for this plan
  const enabledFeatures = getEnabledFeaturesForPlan(plan.name)

  // Update organization with plan limits and activate
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      status: 'ACTIVE',
      maxUsers: plan.maxUsers,
      maxClients: plan.maxClients,
      maxSMSPerMonth: plan.maxSMSPerMonth,
      maxStorageGB: plan.maxStorageGB,
      maxPrograms: plan.maxPrograms,
      enabledFeatures: JSON.stringify(enabledFeatures),
      isTrialUsed: true,
    },
  })

  // Invalidate organization cache
  await invalidateOrgCache(organizationId)
  console.log('Subscription activated via verify endpoint for organization:', organizationId)
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 })
    }

    // First check our database - try to find payment by reference
    // Use a more flexible query since the organization relationship might not be established yet
    let payment = await prisma.subscriptionPayment.findFirst({
      where: {
        providerPaymentId: reference,
      },
      include: {
        subscription: {
          include: {
            plan: true,
            organization: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Get organization - either from the subscription relation or find it directly
    let organization = payment.subscription.organization
    if (!organization) {
      organization = await prisma.organization.findFirst({
        where: { subscriptionId: payment.subscriptionId },
      })
    }

    // Verify the user belongs to this organization
    if (!organization || organization.id !== session.user.organizationId) {
      return NextResponse.json({ error: 'Payment not found for your organization' }, { status: 404 })
    }

    const plan = payment.subscription.plan

    // If already completed in our database and subscription is active, return success
    if (payment.status === 'COMPLETED' && payment.subscription.status === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        data: {
          paymentStatus: 'COMPLETED',
          subscriptionStatus: 'ACTIVE',
          organizationStatus: organization.status,
          planName: plan.name,
        },
      })
    }

    // If still pending or subscription not active, verify with Paystack
    try {
      const paystack = getPaystackService()
      const verification = await paystack.verifyPayment(reference)

      if (verification.data?.status === 'success') {
        // Payment was successful on Paystack side
        // Activate the subscription immediately (don't wait for webhook)
        if (payment.status === 'PENDING' || payment.subscription.status !== 'ACTIVE') {
          await activateSubscription(
            payment.id,
            payment.subscriptionId,
            organization.id,
            plan
          )

          return NextResponse.json({
            success: true,
            data: {
              paymentStatus: 'COMPLETED',
              subscriptionStatus: 'ACTIVE',
              organizationStatus: 'ACTIVE',
              planName: plan.name,
            },
          })
        }
      } else if (verification.data?.status === 'failed') {
        // Payment failed on Paystack
        await prisma.subscriptionPayment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failureReason: verification.data.gateway_response || 'Payment failed',
          },
        })

        return NextResponse.json({
          success: false,
          error: 'Payment failed',
          data: {
            paymentStatus: 'FAILED',
            reason: verification.data.gateway_response,
          },
        })
      } else if (verification.data?.status === 'abandoned') {
        return NextResponse.json({
          success: false,
          error: 'Payment was abandoned',
          data: {
            paymentStatus: 'ABANDONED',
          },
        })
      }
    } catch (paystackError) {
      console.error('Paystack verification error:', paystackError)
      // Continue with database status if Paystack verification fails
    }

    // Return current status from database
    return NextResponse.json({
      success: true,
      data: {
        paymentStatus: payment.status,
        subscriptionStatus: payment.subscription.status,
        organizationStatus: organization.status,
        planName: plan.name,
      },
    })
  } catch (error) {
    console.error('Error verifying subscription payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
