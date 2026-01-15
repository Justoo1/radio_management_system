/**
 * Manual Payment Verification for Airtime Booking
 * Use this endpoint to manually verify payment when webhook isn't configured
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  getPaystackService,
  mapChannelToPaymentMethod,
} from '@/lib/integrations/paystack'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { organizationId } = session.user as { organizationId: string }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find booking
    const booking = await prisma.airtimeBooking.findFirst({
      where: {
        id,
        organizationId,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (booking.paymentStatus === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        data: {
          bookingRef: booking.bookingRef,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
      })
    }

    // Need payment reference to verify
    if (!booking.paymentReference) {
      return NextResponse.json(
        { error: 'No payment reference found for this booking' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const paystack = getPaystackService()
    const verification = await paystack.verifyPayment(booking.paymentReference)

    if (verification.data.status === 'success') {
      // Update booking
      await prisma.airtimeBooking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'COMPLETED',
          paymentMethod: mapChannelToPaymentMethod(verification.data.channel),
          paidAt: new Date(verification.data.paid_at || verification.data.paidAt),
          status: 'PENDING_REVIEW',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          bookingRef: booking.bookingRef,
          status: 'PENDING_REVIEW',
          paymentStatus: 'COMPLETED',
          paidAt: verification.data.paid_at || verification.data.paidAt,
          channel: verification.data.channel,
          amount: verification.data.amount / 100, // Convert from pesewas
        },
      })
    } else {
      // Payment not successful
      return NextResponse.json({
        success: false,
        message: `Payment status: ${verification.data.status}`,
        data: {
          bookingRef: booking.bookingRef,
          paystackStatus: verification.data.status,
          gatewayResponse: verification.data.gateway_response,
        },
      })
    }

  } catch (error) {
    console.error('Error verifying payment:', error)

    if (error instanceof Error && error.name === 'PaystackError') {
      return NextResponse.json(
        { error: `Payment verification failed: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
