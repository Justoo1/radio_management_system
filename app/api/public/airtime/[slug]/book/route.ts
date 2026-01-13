/**
 * Public API: Create Airtime Booking
 * Allows guests to submit airtime booking requests
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { airtimeBookingCreateSchema } from '@/lib/validations/airtime.validation'
import { generatePaymentReference } from '@/lib/integrations/paystack'
import { ZodError } from 'zod'

// Generate booking reference: ABK-YYYYMMDD-RANDOM
function generateBookingRef(): string {
  return generatePaymentReference('ABK')
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Validate request body
    const validatedData = airtimeBookingCreateSchema.parse(body)

    // Find organization by slug
    const organization = await prisma.organization.findFirst({
      where: { slug },
      include: {
        streamingConfig: {
          select: {
            id: true,
            isEnabled: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      )
    }

    // Check if streaming is enabled
    if (!organization.streamingConfig?.isEnabled) {
      return NextResponse.json(
        { error: 'Airtime booking is not available for this station' },
        { status: 403 }
      )
    }

    // Get the selected package
    const pkg = await prisma.airtimePackage.findFirst({
      where: {
        id: validatedData.packageId,
        organizationId: organization.id,
        isActive: true,
      },
    })

    if (!pkg) {
      return NextResponse.json(
        { error: 'Selected package not found or is not available' },
        { status: 400 }
      )
    }

    // Validate requested date (must be in the future)
    const requestedDate = new Date(validatedData.requestedDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (requestedDate < now) {
      return NextResponse.json(
        { error: 'Requested date must be in the future' },
        { status: 400 }
      )
    }

    // Check if requested day is allowed (if package has day restrictions)
    if (pkg.allowedDays) {
      const allowedDays = JSON.parse(pkg.allowedDays) as number[]
      const requestedDay = requestedDate.getDay()

      if (!allowedDays.includes(requestedDay)) {
        return NextResponse.json(
          { error: 'This package is not available on the selected day' },
          { status: 400 }
        )
      }
    }

    // Check if requested time is within allowed hours
    if (pkg.allowedHoursStart && pkg.allowedHoursEnd) {
      const [startHour, startMin] = pkg.allowedHoursStart.split(':').map(Number)
      const [endHour, endMin] = pkg.allowedHoursEnd.split(':').map(Number)
      const [reqHour, reqMin] = validatedData.requestedStartTime.split(':').map(Number)

      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const reqMinutes = reqHour * 60 + reqMin

      if (reqMinutes < startMinutes || reqMinutes >= endMinutes) {
        return NextResponse.json(
          {
            error: `This package is only available between ${pkg.allowedHoursStart} and ${pkg.allowedHoursEnd}`
          },
          { status: 400 }
        )
      }
    }

    // Generate unique booking reference
    const bookingRef = generateBookingRef()

    // Create booking with PENDING_PAYMENT status
    const booking = await prisma.airtimeBooking.create({
      data: {
        organizationId: organization.id,
        bookingRef,
        guestName: validatedData.guestName,
        guestEmail: validatedData.guestEmail,
        guestPhone: validatedData.guestPhone,
        guestType: validatedData.guestType,
        guestTypeOther: validatedData.guestTypeOther,
        programTitle: validatedData.programTitle,
        programDescription: validatedData.programDescription,
        packageId: pkg.id,
        requestedDate: requestedDate,
        requestedStartTime: validatedData.requestedStartTime,
        paymentAmount: pkg.price,
        paymentCurrency: pkg.currency,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
      },
      select: {
        id: true,
        bookingRef: true,
        guestName: true,
        guestEmail: true,
        programTitle: true,
        requestedDate: true,
        requestedStartTime: true,
        paymentAmount: true,
        paymentCurrency: true,
        status: true,
        package: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      booking: {
        ...booking,
        paymentAmount: Number(booking.paymentAmount),
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating airtime booking:', error)

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

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
