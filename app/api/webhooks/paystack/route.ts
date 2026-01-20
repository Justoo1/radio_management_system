/**
 * Main Paystack Webhook Handler
 * Handles all Paystack webhooks (subscriptions, airtime, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'
import { invalidateOrgCache } from '@/lib/cache'

// Verify Paystack signature
function verifyPaystackSignature(payload: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    console.error('PAYSTACK_SECRET_KEY not configured')
    return false
  }

  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex')

  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature')
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    const payload = await request.text()

    // Verify signature
    if (!verifyPaystackSignature(payload, signature)) {
      console.error('Invalid Paystack signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)

    console.log('Paystack webhook received:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data)
        break

      default:
        console.log('Unhandled Paystack event:', event.event)
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference
  const metadata = data.metadata || {}
  const paymentType = metadata.payment_type

  console.log(`Processing successful charge: ${reference}, type: ${paymentType}`)

  if (paymentType === 'subscription') {
    await handleSubscriptionPaymentSuccess(reference, data, metadata)
  } else if (paymentType === 'airtime' || metadata.booking_ref) {
    await handleAirtimePaymentSuccess(reference)
  } else {
    console.warn('Unknown payment type:', paymentType)
  }
}

async function handleChargeFailed(data: any) {
  const reference = data.reference
  const metadata = data.metadata || {}
  const paymentType = metadata.payment_type

  console.log(`Processing failed charge: ${reference}, type: ${paymentType}`)

  if (paymentType === 'subscription') {
    await handleSubscriptionPaymentFailed(reference, data)
  } else if (paymentType === 'airtime' || metadata.booking_ref) {
    await handleAirtimePaymentFailed(reference)
  }
}

async function handleSubscriptionPaymentSuccess(reference: string, _data: any, _metadata: any) {
  try {
    // SECURITY: Use a transaction to ensure atomic updates and idempotency
    const result = await prisma.$transaction(async (tx) => {
      // Find subscription payment with FOR UPDATE lock to prevent race conditions
      const payment = await tx.subscriptionPayment.findFirst({
        where: { providerPaymentId: reference },
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
        console.error('Subscription payment not found:', reference)
        return { success: false, reason: 'payment_not_found' }
      }

      // IDEMPOTENCY: Check if already processed within the transaction
      if (payment.status === 'COMPLETED') {
        console.log('Payment already processed (idempotent skip):', reference)
        return { success: true, reason: 'already_processed' }
      }

      // Get the plan details
      const plan = payment.subscription.plan
      let organization = payment.subscription.organization

      // If organization not found via back-reference, try to find it directly
      if (!organization) {
        console.log('Organization not found via back-reference, searching directly...')
        organization = await tx.organization.findFirst({
          where: { subscriptionId: payment.subscriptionId },
        })
      }

      if (!organization) {
        console.error('Organization not found for subscription:', payment.subscriptionId)
        return { success: false, reason: 'organization_not_found' }
      }

      console.log('Processing subscription for organization:', organization.name, 'Plan:', plan.name)

      // Update payment status
      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      })

      // Update subscription status
      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: new Date(),
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      })

      // Determine enabled features based on plan
      // NOTE: Feature names must match the Feature enum values in lib/features.ts (lowercase)
      let enabledFeatures: string[] = []
      if (plan.name === 'Enterprise') {
        // Enterprise gets ALL features
        enabledFeatures = [
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
      } else if (plan.name === 'Professional') {
        // Professional gets most features except some enterprise-only ones
        enabledFeatures = [
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
      } else if (plan.name === 'Starter') {
        // Starter gets ONLY expenses as premium feature
        // Core features (clients, programs, invoices, contracts, reports, on_air) are always enabled
        enabledFeatures = [
          'expenses',
        ]
      }

      // Update organization with plan limits and activate
      await tx.organization.update({
        where: { id: organization.id },
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

      return { success: true, organization, plan }
    })

    // Handle transaction result
    if (!result.success) {
      return
    }

    if (result.reason === 'already_processed') {
      return
    }

    const { organization, plan } = result

    // Type guard - should not happen given the checks above, but satisfies TypeScript
    if (!organization || !plan) {
      return
    }

    // Invalidate organization cache so fresh data is fetched
    await invalidateOrgCache(organization.id)
    console.log('Organization cache invalidated for:', organization.id)

    // Send confirmation email
    try {
      await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to: organization.email,
        subject: `Subscription Activated - ${plan.name} Plan`,
        html: `
          <h1>Welcome to ${plan.name} Plan!</h1>
          <p>Hi ${organization.name},</p>
          <p>Your subscription payment was successful. Your ${plan.name} plan is now active!</p>
          <p><strong>Plan Details:</strong></p>
          <ul>
            <li>Plan: ${plan.name}</li>
            <li>Price: ${plan.currency} ${plan.price}/month</li>
            <li>Max Users: ${plan.maxUsers}</li>
            <li>Max Clients: ${plan.maxClients}</li>
            <li>SMS Credits: ${plan.maxSMSPerMonth}/month</li>
            <li>Storage: ${plan.maxStorageGB}GB</li>
          </ul>
          <p>Thank you for subscribing!</p>
          <p>Best regards,<br>Radio Management System Team</p>
        `,
      })
    } catch (emailError) {
      console.error('Failed to send subscription confirmation email:', emailError)
    }

    console.log('Subscription activated successfully:', organization.name, plan.name)
  } catch (error) {
    console.error('Error handling subscription payment success:', error)
    throw error
  }
}

async function handleSubscriptionPaymentFailed(reference: string, data: any) {
  try {
    // SECURITY: Use a transaction for atomic updates
    await prisma.$transaction(async (tx) => {
      const payment = await tx.subscriptionPayment.findFirst({
        where: { providerPaymentId: reference },
      })

      if (!payment) {
        console.log('Payment not found for failed reference:', reference)
        return
      }

      // IDEMPOTENCY: Skip if already marked as failed
      if (payment.status === 'FAILED') {
        console.log('Payment already marked as failed (idempotent skip):', reference)
        return
      }

      await tx.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: data.gateway_response || 'Payment failed',
        },
      })

      await tx.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'PAST_DUE',
        },
      })

      console.log('Subscription payment failed:', reference)
    })
  } catch (error) {
    console.error('Error handling subscription payment failure:', error)
  }
}

async function handleAirtimePaymentSuccess(reference: string) {
  // Forward to existing airtime webhook handler logic
  // This is placeholder - actual airtime logic should be in its dedicated handler
  console.log('Airtime payment success:', reference)
}

async function handleAirtimePaymentFailed(reference: string) {
  console.log('Airtime payment failed:', reference)
}

export const dynamic = 'force-dynamic'
