/**
 * Admin Payments API
 * Record subscription payments and generate receipts/invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json(
        { error: 'Unauthorized - Developer access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      organizationId,
      amount,
      paymentMethod,
      paymentProvider,
      mobileNumber,
      network,
      referenceNumber,
      notes,
    } = body

    // Validate required fields
    if (!organizationId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Organization ID, amount, and payment method are required' },
        { status: 400 }
      )
    }

    // Get organization with subscription
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        owner: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (!organization.subscription) {
      return NextResponse.json(
        { error: 'Organization does not have a subscription' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.subscriptionPayment.create({
      data: {
        subscriptionId: organization.subscription.id,
        amount: parseFloat(amount),
        currency: 'GHS',
        status: 'COMPLETED',
        paymentMethod: paymentMethod,
        provider: paymentProvider || 'HUBTEL',
        providerPaymentId: referenceNumber || null,
        mobileNumber: mobileNumber || null,
        network: network || null,
        metadata: notes ? JSON.stringify({ notes, recordedBy: 'admin' }) : null,
      },
    })

    // Update subscription dates
    const currentPeriodEnd = new Date(organization.subscription.currentPeriodEnd)
    const newPeriodStart = currentPeriodEnd > new Date() ? currentPeriodEnd : new Date()
    const newPeriodEnd = new Date(newPeriodStart)
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

    await prisma.subscription.update({
      where: { id: organization.subscription.id },
      data: {
        status: 'ACTIVE',
        lastPaymentDate: new Date(),
        currentPeriodStart: newPeriodStart,
        currentPeriodEnd: newPeriodEnd,
        nextPaymentDate: newPeriodEnd,
      },
    })

    // Update organization status to ACTIVE if not already
    if (organization.status !== 'ACTIVE') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          status: 'ACTIVE',
        },
      })
    }

    // Log the payment
    if (organization.ownerId) {
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: organization.ownerId,
          action: 'PAYMENT_RECORDED',
          resource: 'SubscriptionPayment',
          resourceId: payment.id,
          description: `Payment of GHS ${amount} recorded by admin for ${organization.subscription.plan.name} plan. ${notes ? `Notes: ${notes}` : ''}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      payment: {
        id: payment.id,
        amount: parseFloat(payment.amount.toString()),
        status: payment.status,
        createdAt: payment.createdAt,
      },
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
