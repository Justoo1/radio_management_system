/**
 * Paystack Webhook Handler for Airtime Payments
 * Handles payment confirmation callbacks from Paystack
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  parseWebhookEvent,
  mapChannelToPaymentMethod,
  PaystackError,
} from '@/lib/integrations/paystack'

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('Missing Paystack signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Parse and validate webhook event
    let event
    try {
      event = parseWebhookEvent(body, signature, secretKey)
    } catch (error) {
      if (error instanceof PaystackError && error.statusCode === 401) {
        console.error('Invalid Paystack webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
      throw error
    }

    console.log(`Received Paystack webhook: ${event.event}`, {
      reference: event.data.reference,
      status: event.data.status,
    })

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data)
        break

      case 'refund.processed':
        await handleRefundProcessed(event.data)
        break

      case 'refund.failed':
        await handleRefundFailed(event.data)
        break

      default:
        console.log(`Unhandled Paystack event: ${event.event}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing Paystack webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handleChargeSuccess(data: {
  reference: string
  amount: number
  channel: string
  paid_at: string
  metadata: Record<string, unknown>
  customer: { email: string }
}) {
  const { reference, amount, channel, paid_at } = data

  // Find booking by payment reference
  const booking = await prisma.airtimeBooking.findFirst({
    where: { paymentReference: reference },
  })

  if (!booking) {
    console.log(`No booking found for payment reference: ${reference}`)
    // Check metadata for booking info
    const bookingRef = data.metadata?.booking_ref as string
    if (bookingRef) {
      const bookingByRef = await prisma.airtimeBooking.findUnique({
        where: { bookingRef },
      })

      if (bookingByRef) {
        await updateBookingPayment(bookingByRef.id, {
          paymentReference: reference,
          channel,
          paidAt: paid_at,
        })
        return
      }
    }
    return
  }

  await updateBookingPayment(booking.id, {
    paymentReference: reference,
    channel,
    paidAt: paid_at,
  })
}

/**
 * Update booking with successful payment
 */
async function updateBookingPayment(
  bookingId: string,
  data: {
    paymentReference: string
    channel: string
    paidAt: string
  }
) {
  const { paymentReference, channel, paidAt } = data

  await prisma.airtimeBooking.update({
    where: { id: bookingId },
    data: {
      paymentReference,
      paymentStatus: 'COMPLETED',
      paymentMethod: mapChannelToPaymentMethod(channel),
      paidAt: new Date(paidAt),
      status: 'PENDING_REVIEW', // Move to admin review
      paymentConfirmationSent: false, // Will be sent by notification job
    },
  })

  console.log(`Payment confirmed for booking ${bookingId}`)

  // TODO: Send payment confirmation email
  // await sendPaymentConfirmationEmail(booking)
}

/**
 * Handle failed payment
 */
async function handleChargeFailed(data: {
  reference: string
  message: string | null
}) {
  const { reference, message } = data

  // Find booking by payment reference
  const booking = await prisma.airtimeBooking.findFirst({
    where: { paymentReference: reference },
  })

  if (!booking) {
    console.log(`No booking found for failed payment reference: ${reference}`)
    return
  }

  await prisma.airtimeBooking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: 'FAILED',
      status: 'PAYMENT_FAILED',
    },
  })

  console.log(`Payment failed for booking ${booking.id}: ${message || 'Unknown reason'}`)
}

/**
 * Handle successful refund
 */
async function handleRefundProcessed(data: {
  reference: string
  amount: number
}) {
  const { reference } = data

  // Find booking by original payment reference
  const booking = await prisma.airtimeBooking.findFirst({
    where: { paymentReference: reference },
  })

  if (!booking) {
    console.log(`No booking found for refund reference: ${reference}`)
    return
  }

  await prisma.airtimeBooking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: 'REFUNDED',
      refundedAt: new Date(),
    },
  })

  console.log(`Refund processed for booking ${booking.id}`)
}

/**
 * Handle failed refund
 */
async function handleRefundFailed(data: {
  reference: string
}) {
  const { reference } = data

  console.log(`Refund failed for payment reference: ${reference}`)

  // Log for manual resolution
  // Could also send notification to admin
}

export const dynamic = 'force-dynamic'
