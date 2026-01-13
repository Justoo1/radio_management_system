/**
 * Booking Status Page
 * Allows guests to check their booking status
 */

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Radio,
  Mail,
  Phone,
  AlertCircle,
  ExternalLink,
  Copy,
  Loader2,
  ArrowLeft,
} from 'lucide-react'

interface Props {
  params: Promise<{ bookingRef: string }>
}

const STATUS_CONFIG: Record<string, { color: string; icon: 'check' | 'x' | 'clock' | 'alert' | 'radio'; label: string; description: string }> = {
  PENDING_PAYMENT: {
    color: 'amber',
    icon: 'clock',
    label: 'Awaiting Payment',
    description: 'Please complete your payment to proceed with the booking.',
  },
  PAYMENT_FAILED: {
    color: 'red',
    icon: 'x',
    label: 'Payment Failed',
    description: 'Your payment could not be processed. Please try again.',
  },
  PENDING_REVIEW: {
    color: 'blue',
    icon: 'clock',
    label: 'Pending Review',
    description: 'Your payment was successful. The station is reviewing your request.',
  },
  APPROVED: {
    color: 'emerald',
    icon: 'check',
    label: 'Approved',
    description: 'Your booking has been approved! Check your email for broadcast credentials.',
  },
  REJECTED: {
    color: 'red',
    icon: 'x',
    label: 'Rejected',
    description: 'Unfortunately, your booking was not approved. A refund will be processed.',
  },
  SCHEDULED: {
    color: 'purple',
    icon: 'clock',
    label: 'Scheduled',
    description: 'Your broadcast is scheduled. Be ready to go live at the scheduled time.',
  },
  LIVE: {
    color: 'red',
    icon: 'radio',
    label: 'Live Now',
    description: 'You are currently live on air!',
  },
  COMPLETED: {
    color: 'slate',
    icon: 'check',
    label: 'Completed',
    description: 'Your broadcast has been completed. Thank you for using our service.',
  },
  NO_SHOW: {
    color: 'orange',
    icon: 'alert',
    label: 'No Show',
    description: 'You did not connect at your scheduled time. No refund will be issued.',
  },
  CANCELLED: {
    color: 'slate',
    icon: 'x',
    label: 'Cancelled',
    description: 'This booking has been cancelled.',
  },
  EXPIRED: {
    color: 'slate',
    icon: 'x',
    label: 'Expired',
    description: 'This booking has expired.',
  },
}

export async function generateMetadata({ params }: Props) {
  const { bookingRef } = await params
  return {
    title: `Booking Status - ${bookingRef}`,
    description: 'Check the status of your airtime booking.',
  }
}

export default async function BookingStatusPage({ params }: Props) {
  const { bookingRef } = await params

  const booking = await prisma.airtimeBooking.findFirst({
    where: { bookingRef },
    include: {
      package: true,
      organization: true,
    },
  })

  if (!booking) {
    notFound()
  }

  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING_PAYMENT

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const getIcon = (icon: string, className: string) => {
    switch (icon) {
      case 'check':
        return <CheckCircle className={className} />
      case 'x':
        return <XCircle className={className} />
      case 'clock':
        return <Clock className={className} />
      case 'alert':
        return <AlertCircle className={className} />
      case 'radio':
        return <Radio className={className} />
      default:
        return <Clock className={className} />
    }
  }

  const isPendingPayment = booking.status === 'PENDING_PAYMENT'
  const hasCredentials = booking.djUsername && booking.djPassword
  const isLive = booking.status === 'LIVE'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-${statusConfig.color}-500/20 to-transparent rounded-full blur-3xl`} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-slate-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/book/${booking.organization.slug}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Book another slot
        </Link>

        {/* Status Header */}
        <div className={`bg-${statusConfig.color}-500/20 backdrop-blur-xl rounded-2xl p-8 border border-${statusConfig.color}-500/30 mb-6 text-center`}>
          <div className={`inline-flex p-4 rounded-full bg-${statusConfig.color}-500/20 border border-${statusConfig.color}-400/30 mb-4`}>
            {getIcon(statusConfig.icon, `w-10 h-10 text-${statusConfig.color}-400`)}
          </div>
          <h1 className={`text-2xl font-bold text-${statusConfig.color}-300 mb-2`}>
            {statusConfig.label}
          </h1>
          <p className={`text-${statusConfig.color}-400/70`}>{statusConfig.description}</p>

          {isLive && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-300 font-medium">Broadcasting Live</span>
            </div>
          )}
        </div>

        {/* Booking Reference */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Booking Reference</p>
              <p className="text-2xl font-mono font-bold text-white">{booking.bookingRef}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-3 rounded-xl border border-cyan-400/30 backdrop-blur">
                <Radio className="w-6 h-6 text-cyan-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast Credentials (if approved) */}
        {hasCredentials && (
          <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 mb-6">
            <h2 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Broadcast Credentials
            </h2>
            <p className="text-sm text-emerald-400/70 mb-4">
              Use these credentials to connect via Web DJ at your scheduled time.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-emerald-500/10 rounded-xl p-4">
                <p className="text-xs text-emerald-400/60 mb-1">Username</p>
                <p className="font-mono text-white text-lg">{booking.djUsername}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-xl p-4">
                <p className="text-xs text-emerald-400/60 mb-1">Password</p>
                <p className="font-mono text-white text-lg">{booking.djPassword}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-400/50 mt-4">
              Keep these credentials safe. They will only work during your scheduled time slot.
            </p>
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Booking Details</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Guest Name</span>
              <span className="text-white">{booking.guestName}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Program</span>
              <span className="text-white">{booking.programTitle}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Package</span>
              <span className="text-white">{booking.package.name}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Duration</span>
              <span className="text-white">{formatDuration(booking.package.durationMinutes)}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Requested</span>
              </div>
              <span className="text-white">
                {formatDate(booking.requestedDate)} at {booking.requestedStartTime}
              </span>
            </div>

            {booking.approvedDate && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-sm text-emerald-400/80 mb-1">Confirmed Schedule</p>
                <p className="text-white font-medium">
                  {formatDate(booking.approvedDate)} at {booking.approvedStartTime} - {booking.approvedEndTime}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Payment</span>
              <span className={`font-medium ${booking.paymentStatus === 'COMPLETED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                {booking.paymentCurrency} {Number(booking.paymentAmount).toFixed(2)} - {booking.paymentStatus}
              </span>
            </div>

            {booking.refundReason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-sm text-red-400/80 mb-1">Rejection Reason</p>
                <p className="text-white">{booking.refundReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isPendingPayment && (
          <Link
            href={`/book/${booking.organization.slug}/pay/${booking.bookingRef}`}
            className="block w-full text-center bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 mb-6"
          >
            Complete Payment
          </Link>
        )}

        {/* Station Info */}
        <div className="text-center pt-6 border-t border-white/10">
          <p className="text-slate-400 mb-2">{booking.organization.name}</p>
          <p className="text-sm text-slate-500">
            Booking created on {booking.createdAt.toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
