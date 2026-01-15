/**
 * Booking Confirmation Page
 * Shows confirmation after successful payment
 */

import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import {
  CheckCircle,
  Calendar,
  Clock,
  Mail,
  Radio,
  ArrowRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

interface Props {
  params: Promise<{ slug: string; bookingRef: string }>
}

export async function generateMetadata({ params }: Props) {
  const { bookingRef } = await params
  return {
    title: `Booking Confirmed - ${bookingRef}`,
    description: 'Your airtime booking has been confirmed.',
  }
}

export default async function ConfirmationPage({ params }: Props) {
  const { slug, bookingRef } = await params

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

  const isPaid = booking.paymentStatus === 'COMPLETED'
  const isPendingReview = booking.status === 'PENDING_REVIEW'
  const isApproved = ['APPROVED', 'SCHEDULED', 'LIVE', 'COMPLETED'].includes(booking.status)
  const hasCredentials = booking.djUsername && booking.djPassword

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`${isPaid ? 'bg-emerald-500/20 border-emerald-400/30' : 'bg-amber-500/20 border-amber-400/30'} p-4 rounded-full border backdrop-blur`}>
              {isPaid ? (
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              ) : (
                <AlertCircle className="w-12 h-12 text-amber-400" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isPaid ? 'Booking Confirmed!' : 'Booking Created'}
          </h1>
          <p className="text-slate-400 text-lg">
            {isPaid
              ? 'Your payment was successful. We will review your booking shortly.'
              : 'Please complete payment to proceed with your booking.'}
          </p>
        </div>

        {/* Status Card */}
        <div className={`${isPendingReview ? 'bg-blue-500/20 border-blue-500/30' : isApproved ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-amber-500/20 border-amber-500/30'} backdrop-blur-xl rounded-2xl p-6 border mb-6`}>
          <div className="flex items-center gap-3">
            {isPendingReview ? (
              <>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                <div>
                  <p className="font-medium text-blue-300">Pending Review</p>
                  <p className="text-sm text-blue-400/70">The station will confirm your schedule within 24 hours</p>
                </div>
              </>
            ) : isApproved ? (
              <>
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <div>
                  <p className="font-medium text-emerald-300">Approved</p>
                  <p className="text-sm text-emerald-400/70">Your booking has been approved!</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-amber-400 rounded-full" />
                <div>
                  <p className="font-medium text-amber-300">Awaiting Payment</p>
                  <p className="text-sm text-amber-400/70">Complete payment to proceed</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Booking Details</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Booking Reference</span>
              <span className="font-mono font-bold text-white">{booking.bookingRef}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Program</span>
              <span className="text-white">{booking.programTitle}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-slate-400">Package</span>
              <span className="text-white">{booking.package.name} ({formatDuration(booking.package.durationMinutes)})</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Requested Date</span>
              </div>
              <span className="text-white">{formatDate(booking.requestedDate)}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Requested Time</span>
              </div>
              <span className="text-white">{booking.requestedStartTime}</span>
            </div>

            {booking.approvedDate && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-sm text-emerald-400/80 mb-2">Confirmed Schedule</p>
                <p className="text-white font-medium">
                  {formatDate(booking.approvedDate)} at {booking.approvedStartTime} - {booking.approvedEndTime}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between py-3">
              <span className="text-slate-400">Amount Paid</span>
              <span className="text-xl font-bold text-emerald-300">
                {booking.paymentCurrency} {Number(booking.paymentAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">What&apos;s Next?</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {isPaid ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <div>
                <p className={`font-medium ${isPaid ? 'text-emerald-300' : 'text-white'}`}>Payment</p>
                <p className="text-sm text-slate-400">
                  {isPaid ? 'Payment completed successfully' : 'Complete your payment to proceed'}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isApproved ? 'bg-emerald-500 text-white' : isPendingReview ? 'bg-blue-500 text-white animate-pulse' : 'bg-white/20 text-slate-400'}`}>
                {isApproved ? <CheckCircle className="w-4 h-4" /> : '2'}
              </div>
              <div>
                <p className={`font-medium ${isApproved ? 'text-emerald-300' : isPendingReview ? 'text-blue-300' : 'text-slate-400'}`}>Review</p>
                <p className="text-sm text-slate-400">
                  {isApproved ? 'Your booking has been approved' : 'Station reviews and confirms your schedule'}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isApproved ? 'bg-white/20 text-white' : 'bg-white/20 text-slate-400'}`}>
                3
              </div>
              <div>
                <p className={`font-medium ${isApproved ? 'text-white' : 'text-slate-400'}`}>Broadcast</p>
                <p className="text-sm text-slate-400">
                  {isApproved
                    ? 'You will receive your broadcast credentials via email'
                    : 'Receive credentials and go live at your scheduled time'}
                </p>
              </div>
            </li>
          </ol>
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

            {/* Broadcast Portal Link */}
            <Link
              href={`/broadcast/${booking.bookingRef}`}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Broadcast Portal
            </Link>
          </div>
        )}

        {/* Email Notice */}
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 mb-6">
          <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            We&apos;ve sent a confirmation to <span className="text-white">{booking.guestEmail}</span>. Check your inbox for updates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/book/status/${booking.bookingRef}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
          >
            Check Status
            <ArrowRight className="w-4 h-4" />
          </Link>

          {!isPaid && (
            <Link
              href={`/book/${slug}/pay/${booking.bookingRef}`}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
            >
              Complete Payment
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Station Info */}
        <div className="text-center mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
            <Radio className="w-4 h-4" />
            <span>{booking.organization.name}</span>
          </div>
          <p className="text-sm text-slate-500">
            Questions? Contact the station directly.
          </p>
        </div>
      </div>
    </div>
  )
}
