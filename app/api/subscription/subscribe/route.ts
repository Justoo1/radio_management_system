/**
 * Subscription Payment API
 * Initialize Paystack payment for subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaystackService, ghsToPesewas, generatePaymentReference } from '@/lib/integrations/paystack'
import { z } from 'zod'

const subscribeSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = subscribeSchema.parse(body)

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        subscriptionId: true,
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get the selected plan
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 })
    }

    // Check if organization already has an active subscription
    if (organization.subscriptionId) {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { id: organization.subscriptionId },
      })

      if (existingSubscription && existingSubscription.status === 'ACTIVE') {
        return NextResponse.json(
          { error: 'You already have an active subscription. Please contact support to change plans.' },
          { status: 400 }
        )
      }
    }

    // Generate payment reference
    const paymentReference = generatePaymentReference('SUB')

    // Build callback URL - redirect to callback page that verifies payment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/subscription/callback`

    // Initialize Paystack payment
    const paystack = getPaystackService()
    const amount = ghsToPesewas(Number(plan.price))

    const paymentInit = await paystack.initializePayment({
      email: organization.email,
      amount,
      reference: paymentReference,
      currency: plan.currency,
      callbackUrl,
      channels: ['card', 'mobile_money'],
      metadata: {
        payment_type: 'subscription',
        organization_id: organization.id,
        organization_name: organization.name,
        plan_id: plan.id,
        plan_name: plan.name,
        plan_price: plan.price.toString(),
        user_email: session.user.email,
        custom_fields: [
          {
            display_name: 'Organization',
            variable_name: 'organization',
            value: organization.name,
          },
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: plan.name,
          },
          {
            display_name: 'Amount',
            variable_name: 'amount',
            value: `${plan.currency} ${plan.price}`,
          },
        ],
      },
    })

    // Create or update subscription record
    let subscription
    if (organization.subscriptionId) {
      subscription = await prisma.subscription.update({
        where: { id: organization.subscriptionId },
        data: {
          planId: plan.id,
          // Keep as TRIALING until payment is confirmed via webhook
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })
    } else {
      subscription = await prisma.subscription.create({
        data: {
          planId: plan.id,
          status: 'TRIALING',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      })

      // Link subscription to organization
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscriptionId: subscription.id,
        },
      })
    }

    // Create subscription payment record
    // Note: Using OTHER/STRIPE as placeholders until PAYSTACK is added to PaymentProvider enum
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'PENDING',
        paymentMethod: 'OTHER', // Will be updated to actual method (CARD/MOBILE_MONEY) via webhook
        provider: 'STRIPE', // Using STRIPE as placeholder for PAYSTACK
        providerPaymentId: paymentReference,
        description: `Subscription payment for ${plan.name} plan (Paystack)`,
        metadata: JSON.stringify({
          plan_id: plan.id,
          plan_name: plan.name,
          organization_id: organization.id,
          payment_provider: 'PAYSTACK', // Actual provider stored in metadata
        }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: paymentInit.data.authorization_url,
        access_code: paymentInit.data.access_code,
        reference: paymentInit.data.reference,
      },
    })
  } catch (error) {
    console.error('Error initializing subscription payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.name === 'PaystackError') {
      return NextResponse.json(
        { error: `Payment initialization failed: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to initialize subscription payment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
