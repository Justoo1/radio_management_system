/**
 * Guest Broadcast Portal
 * Allows approved guests to access the Web DJ for their scheduled time
 */

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import BroadcastClient from './BroadcastClient'

interface Props {
  params: Promise<{ bookingRef: string }>
}

export async function generateMetadata({ params }: Props) {
  const { bookingRef } = await params
  return {
    title: `Broadcast Portal - ${bookingRef}`,
    description: 'Access your scheduled broadcast slot.',
  }
}

export default async function GuestBroadcastPage({ params }: Props) {
  const { bookingRef } = await params

  const booking = await prisma.airtimeBooking.findFirst({
    where: { bookingRef },
    include: {
      package: true,
      organization: {
        include: {
          streamingConfig: true,
        },
      },
    },
  })

  if (!booking) {
    notFound()
  }

  // Check if booking is approved/scheduled
  if (!['APPROVED', 'SCHEDULED', 'LIVE'].includes(booking.status)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-slate-400 mb-6">
            {booking.status === 'PENDING_REVIEW'
              ? 'Your booking is still pending review. Please wait for approval.'
              : booking.status === 'PENDING_PAYMENT'
              ? 'Please complete payment to access the broadcast portal.'
              : `This booking cannot be accessed. Status: ${booking.status}`}
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

  // Check if streaming config exists
  if (!booking.organization.streamingConfig?.azuracastStationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Streaming Not Configured</h1>
          <p className="text-slate-400">The station has not configured streaming. Please contact the station.</p>
        </div>
      </div>
    )
  }

  // Build Web DJ URL
  const azuracastUrl = process.env.AZURACAST_URL || ''
  const stationId = booking.organization.streamingConfig.azuracastStationId
  const webDjUrl = `${azuracastUrl}/public/${stationId}/webdj`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <BroadcastClient
        booking={{
          bookingRef: booking.bookingRef,
          guestName: booking.guestName,
          programTitle: booking.programTitle,
          status: booking.status,
          approvedDate: booking.approvedDate?.toISOString() || null,
          approvedStartTime: booking.approvedStartTime || '',
          approvedEndTime: booking.approvedEndTime || '',
          djUsername: booking.djUsername || '',
          djPassword: booking.djPassword || '',
          durationMinutes: booking.package.durationMinutes,
        }}
        organizationName={booking.organization.name}
        webDjUrl={webDjUrl}
      />
    </div>
  )
}
