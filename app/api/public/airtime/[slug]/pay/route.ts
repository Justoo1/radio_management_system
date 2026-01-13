/**
 * Public API: Initiate Airtime Payment
 * Initiates Paystack payment for an airtime booking
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import {
  getPaystackService,
  ghsToPesewas,
  generatePaymentReference,
} from '@/lib/integrations/paystack'
import { airtimePaymentInitSchema } from '@/lib/validations/airtime.validation'
import { ZodError } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = airtimePaymentInitSchema.parse(body)

    // Find organization by slug
    const organization = await prisma.organization.findFirst({
      where: { slug },
      select: { id: true, name: true },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    // Find booking by reference
    const booking = await prisma.airtimeBooking.findFirst({
      where: {
        bookingRef: validatedData.bookingRef,
        organizationId: organization.id,
      },
      include: {
        package: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if booking is in a valid state for payment
    if (booking.status !== 'PENDING_PAYMENT' && booking.status !== 'PAYMENT_FAILED') {
      return NextResponse.json(
        {
          error: 'This booking cannot be paid for',
          currentStatus: booking.status
        },
        { status: 400 }
      )
    }

    // Check if already paid
    if (booking.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'This booking has already been paid for' },
        { status: 400 }
      )
    }

    // Generate unique payment reference
    const paymentReference = generatePaymentReference('PAY')

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    const callbackUrl = `${baseUrl}/book/${slug}/confirmation/${booking.bookingRef}`

    // Initialize Paystack payment
    const paystack = getPaystackService()

    const channels: ('card' | 'mobile_money')[] = ['card', 'mobile_money']

    const paymentInit = await paystack.initializePayment({
      email: booking.guestEmail,
      amount: ghsToPesewas(Number(booking.paymentAmount)),
      reference: paymentReference,
      currency: booking.paymentCurrency,
      callbackUrl,
      channels,
      metadata: {
        booking_ref: booking.bookingRef,
        booking_id: booking.id,
        organization_id: organization.id,
        station_name: organization.name,
        guest_name: booking.guestName,
        program_title: booking.programTitle,
        package_name: booking.package.name,
        duration_minutes: booking.package.durationMinutes,
        custom_fields: [
          {
            display_name: 'Booking Reference',
            variable_name: 'booking_ref',
            value: booking.bookingRef,
          },
          {
            display_name: 'Program',
            variable_name: 'program',
            value: booking.programTitle,
          },
          {
            display_name: 'Package',
            variable_name: 'package',
            value: booking.package.name,
          },
        ],
      },
      // For mobile money
      mobileMoneyPhone: validatedData.mobileMoneyPhone,
      mobileMoneyProvider: validatedData.mobileMoneyProvider,
    })

    // Update booking with payment reference
    await prisma.airtimeBooking.update({
      where: { id: booking.id },
      data: {
        paymentReference,
        paymentProvider: 'PAYSTACK',
        paymentMethod: validatedData.paymentMethod || null,
      },
    })

    return NextResponse.json({
      success: true,
      authorization_url: paymentInit.data.authorization_url,
      access_code: paymentInit.data.access_code,
      reference: paymentInit.data.reference,
    })

  } catch (error) {
    console.error('Error initiating airtime payment:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }

    // Handle Paystack errors
    if (error instanceof Error && error.name === 'PaystackError') {
      return NextResponse.json(
        { error: `Payment initialization failed: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
