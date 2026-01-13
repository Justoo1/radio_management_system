/**
 * Airtime Booking Payment Page
 * Handles Paystack payment for airtime bookings
 */

import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import PaymentClient from './PaymentClient'

interface Props {
  params: Promise<{ slug: string; bookingRef: string }>
}

export async function generateMetadata({ params }: Props) {
  const { bookingRef } = await params
  return {
    title: `Complete Payment - ${bookingRef}`,
    description: 'Complete your airtime booking payment securely with Paystack.',
  }
}

export default async function PaymentPage({ params }: Props) {
  const { slug, bookingRef } = await params

  // Fetch booking with organization
  const booking = await prisma.airtimeBooking.findFirst({
    where: {
      bookingRef,
      organization: { slug },
    },
    include: {
      package: true,
      organization: true,
    },
  })

  if (!booking) {
    notFound()
  }

  // If already paid, redirect to confirmation
  if (booking.paymentStatus === 'COMPLETED') {
    redirect(`/book/${slug}/confirmation/${bookingRef}`)
  }

  // If not pending payment, show error
  if (booking.status !== 'PENDING_PAYMENT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Payment Not Available</h1>
          <p className="text-slate-400 mb-6">
            This booking is no longer awaiting payment. Current status: {booking.status}
          </p>
          <a
            href={`/book/status/${bookingRef}`}
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Check Booking Status
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PaymentClient
        booking={{
          id: booking.id,
          bookingRef: booking.bookingRef,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          programTitle: booking.programTitle,
          requestedDate: booking.requestedDate.toISOString(),
          requestedStartTime: booking.requestedStartTime,
          paymentAmount: Number(booking.paymentAmount),
          paymentCurrency: booking.paymentCurrency,
          packageName: booking.package.name,
          packageDuration: booking.package.durationMinutes,
        }}
        organizationName={booking.organization.name}
        organizationSlug={slug}
      />
    </div>
  )
}
