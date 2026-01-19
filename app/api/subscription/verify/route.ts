/**
 * Subscription Payment Verification API
 * Verifies payment status with Paystack and returns current status
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPaystackService } from '@/lib/integrations/paystack'

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

    // First check our database
    const payment = await prisma.subscriptionPayment.findFirst({
      where: {
        providerPaymentId: reference,
        subscription: {
          organization: {
            id: session.user.organizationId,
          },
        },
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

    // If already completed in our database, return success
    if (payment.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        data: {
          paymentStatus: 'COMPLETED',
          subscriptionStatus: payment.subscription.status,
          organizationStatus: payment.subscription.organization?.status,
          planName: payment.subscription.plan.name,
        },
      })
    }

    // If still pending, verify with Paystack
    try {
      const paystack = getPaystackService()
      const verification = await paystack.verifyPayment(reference)

      if (verification.data?.status === 'success') {
        // Payment was successful on Paystack side
        // The webhook should have processed this, but if not, update here
        if (payment.status === 'PENDING') {
          // Update payment status
          await prisma.subscriptionPayment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              paidAt: new Date(),
            },
          })

          // The webhook should handle the rest, but we'll return that it's being processed
          return NextResponse.json({
            success: true,
            data: {
              paymentStatus: 'COMPLETED',
              subscriptionStatus: 'ACTIVE',
              message: 'Payment confirmed, activating subscription...',
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
        organizationStatus: payment.subscription.organization?.status,
        planName: payment.subscription.plan.name,
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
