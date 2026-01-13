/**
 * Public API: Check Booking Status
 * Returns the status of an airtime booking
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingRef: string }> }
) {
  try {
    const { bookingRef } = await params

    if (!bookingRef) {
      return NextResponse.json(
        { error: 'Booking reference is required' },
        { status: 400 }
      )
    }

    // Find booking by reference
    const booking = await prisma.airtimeBooking.findUnique({
      where: { bookingRef },
      select: {
        id: true,
        bookingRef: true,
        guestName: true,
        guestEmail: true,
        programTitle: true,
        programDescription: true,
        requestedDate: true,
        requestedStartTime: true,
        approvedDate: true,
        approvedStartTime: true,
        approvedEndTime: true,
        status: true,
        paymentStatus: true,
        paymentAmount: true,
        paymentCurrency: true,
        paidAt: true,
        djUsername: true,
        // Don't expose password in status check
        wasNoShow: true,
        actualStartTime: true,
        actualEndTime: true,
        createdAt: true,
        package: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
        organization: {
          select: {
            name: true,
            slug: true,
            logo: true,
            streamingConfig: {
              select: {
                streamName: true,
              },
            },
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

    // Build response based on status
    const response: Record<string, unknown> = {
      bookingRef: booking.bookingRef,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      station: {
        name: booking.organization.streamingConfig?.streamName || booking.organization.name,
        slug: booking.organization.slug,
        logo: booking.organization.logo,
      },
      guest: {
        name: booking.guestName,
        email: maskEmail(booking.guestEmail),
      },
      program: {
        title: booking.programTitle,
        description: booking.programDescription,
      },
      package: {
        name: booking.package.name,
        durationMinutes: booking.package.durationMinutes,
      },
      payment: {
        amount: Number(booking.paymentAmount),
        currency: booking.paymentCurrency,
        paidAt: booking.paidAt,
      },
      requested: {
        date: booking.requestedDate,
        startTime: booking.requestedStartTime,
      },
      createdAt: booking.createdAt,
    }

    // Add approved details if approved
    if (booking.status === 'APPROVED' || booking.status === 'SCHEDULED' || booking.status === 'LIVE') {
      response.approved = {
        date: booking.approvedDate,
        startTime: booking.approvedStartTime,
        endTime: booking.approvedEndTime,
      }
    }

    // Add broadcast info if scheduled/live/completed
    if (['SCHEDULED', 'LIVE', 'COMPLETED'].includes(booking.status)) {
      response.broadcast = {
        username: booking.djUsername,
        // Password only shown on secure guest portal, not here
        actualStartTime: booking.actualStartTime,
        actualEndTime: booking.actualEndTime,
      }
    }

    // Add no-show info if applicable
    if (booking.wasNoShow) {
      response.wasNoShow = true
    }

    // Status message for UI
    response.statusMessage = getStatusMessage(booking.status)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching booking status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking status' },
      { status: 500 }
    )
  }
}

/**
 * Mask email for privacy (show first 2 chars and domain)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local.slice(0, 2)}***@${domain}`
}

/**
 * Get human-readable status message
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    PENDING_PAYMENT: 'Awaiting payment. Please complete your payment to proceed.',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    PENDING_REVIEW: 'Payment received! Your booking is under review by the station.',
    APPROVED: 'Your booking has been approved! Check your email for broadcast details.',
    REJECTED: 'Your booking was not approved. A refund has been initiated.',
    SCHEDULED: 'Your broadcast is scheduled. Login credentials have been sent to your email.',
    LIVE: 'You are currently live! Broadcasting in progress.',
    COMPLETED: 'Your broadcast has been completed. Thank you!',
    NO_SHOW: 'You did not connect for your scheduled broadcast.',
    CANCELLED: 'This booking has been cancelled.',
    EXPIRED: 'This booking has expired.',
  }

  return messages[status] || 'Unknown status'
}

export const dynamic = 'force-dynamic'
