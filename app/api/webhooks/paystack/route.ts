/**
 * Main Paystack Webhook Handler
 * Handles all Paystack webhooks (subscriptions, airtime, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { resend, DEFAULT_FROM_EMAIL } from '@/lib/resend'

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

async function handleSubscriptionPaymentSuccess(reference: string, data: any, metadata: any) {
  try {
    // Find subscription payment
    const payment = await prisma.subscriptionPayment.findFirst({
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
      return
    }

    if (payment.status === 'COMPLETED') {
      console.log('Payment already processed:', reference)
      return
    }

    // Update payment status
    await prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    })

    // Get the plan details
    const plan = payment.subscription.plan
    const organization = payment.subscription.organization

    if (!organization) {
      console.error('Organization not found for subscription:', payment.subscriptionId)
      return
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'ACTIVE',
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    })

    // Determine enabled features based on plan
    let enabledFeatures: string[] = []
    if (plan.name === 'Professional' || plan.name === 'Enterprise') {
      enabledFeatures = [
        'SMS_CAMPAIGNS',
        'ADVERTISEMENTS',
        'MEDIA_LIBRARY',
        'WHATSAPP',
        'EXPENSES',
        'ADVANCED_ANALYTICS',
        'REVENUE_REPORTS',
        'CONTRACT_ANALYSIS',
        'INVOICE_AGING',
        'CLIENT_ANALYTICS',
        'PROGRAM_ANALYTICS',
        'SMS_ANALYTICS',
      ]
    } else if (plan.name === 'Starter') {
      enabledFeatures = []
    }

    // Update organization with plan limits and activate
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        status: 'ACTIVE',
        maxUsers: plan.maxUsers,
        maxClients: plan.maxClients,
        maxSMSPerMonth: plan.maxSMSPerMonth,
        maxStorageGB: plan.maxStorageGB,
        enabledFeatures: JSON.stringify(enabledFeatures),
        isTrialUsed: true,
      },
    })

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
    const payment = await prisma.subscriptionPayment.findFirst({
      where: { providerPaymentId: reference },
    })

    if (payment) {
      await prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: data.gateway_response || 'Payment failed',
        },
      })

      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'PAST_DUE',
        },
      })

      console.log('Subscription payment failed:', reference)
    }
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
