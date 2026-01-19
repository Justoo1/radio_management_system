/**
 * Subscription Upgrade/Downgrade API
 * Allows users with active subscriptions to change plans
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaystackService, ghsToPesewas, generatePaymentReference } from '@/lib/integrations/paystack'
import { z } from 'zod'

const upgradeSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = upgradeSchema.parse(body)

    // Get organization with current subscription
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!organization.subscription) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      )
    }

    // Get the new plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: validatedData.planId },
    })

    if (!newPlan || !newPlan.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 })
    }

    // Check if trying to "upgrade" to the same plan
    if (organization.subscription.planId === validatedData.planId) {
      return NextResponse.json(
        { error: 'You are already subscribed to this plan' },
        { status: 400 }
      )
    }

    const currentPlan = organization.subscription.plan
    const isUpgrade = Number(newPlan.price) > Number(currentPlan.price)

    // Generate payment reference
    const paymentReference = generatePaymentReference(isUpgrade ? 'UPG' : 'DWG')

    // Build callback URL - redirect to callback page that verifies payment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/subscription/callback`

    // Initialize Paystack payment
    const paystack = getPaystackService()
    const amount = ghsToPesewas(Number(newPlan.price))

    const paymentInit = await paystack.initializePayment({
      email: organization.email,
      amount,
      reference: paymentReference,
      currency: newPlan.currency,
      callbackUrl,
      channels: ['card', 'mobile_money'],
      metadata: {
        payment_type: 'subscription',
        is_upgrade: isUpgrade,
        organization_id: organization.id,
        organization_name: organization.name,
        plan_id: newPlan.id,
        plan_name: newPlan.name,
        plan_price: newPlan.price.toString(),
        previous_plan_id: currentPlan.id,
        previous_plan_name: currentPlan.name,
        user_email: session.user.email,
        custom_fields: [
          {
            display_name: 'Organization',
            variable_name: 'organization',
            value: organization.name,
          },
          {
            display_name: isUpgrade ? 'Upgrading to' : 'Downgrading to',
            variable_name: 'plan_change',
            value: `${currentPlan.name} → ${newPlan.name}`,
          },
          {
            display_name: 'Amount',
            variable_name: 'amount',
            value: `${newPlan.currency} ${newPlan.price}`,
          },
        ],
      },
    })

    // Update subscription plan (will be activated when payment succeeds via webhook)
    await prisma.subscription.update({
      where: { id: organization.subscription.id },
      data: {
        planId: newPlan.id,
        // Keep current status until payment is confirmed via webhook
      },
    })

    // Create subscription payment record
    await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: organization.subscription.id,
        amount: newPlan.price,
        currency: newPlan.currency,
        status: 'PENDING',
        paymentMethod: 'OTHER',
        provider: 'STRIPE', // Using STRIPE as placeholder for PAYSTACK
        providerPaymentId: paymentReference,
        description: `Plan ${isUpgrade ? 'upgrade' : 'downgrade'}: ${currentPlan.name} → ${newPlan.name} (Paystack)`,
        metadata: JSON.stringify({
          plan_id: newPlan.id,
          plan_name: newPlan.name,
          previous_plan_id: currentPlan.id,
          previous_plan_name: currentPlan.name,
          organization_id: organization.id,
          payment_provider: 'PAYSTACK',
          is_upgrade: isUpgrade,
        }),
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        userId: session.user.id,
        action: 'UPDATE',
        resource: 'subscription',
        resourceId: organization.subscription.id,
        description: `Initiated plan ${isUpgrade ? 'upgrade' : 'downgrade'}: ${currentPlan.name} → ${newPlan.name}`,
      },
    })

    return NextResponse.json({
      success: true,
      isUpgrade,
      data: {
        authorization_url: paymentInit.data.authorization_url,
        access_code: paymentInit.data.access_code,
        reference: paymentInit.data.reference,
        currentPlan: currentPlan.name,
        newPlan: newPlan.name,
      },
    })
  } catch (error) {
    console.error('Error processing plan upgrade:', error)

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
      { error: 'Failed to process plan upgrade' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
