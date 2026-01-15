'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Radio,
  Clock,
  DollarSign,
  Calendar,
  CreditCard,
  Smartphone,
  AlertCircle,
  Loader,
  Shield,
  ArrowLeft,
} from 'lucide-react'

interface BookingData {
  id: string
  bookingRef: string
  guestName: string
  guestEmail: string
  programTitle: string
  requestedDate: string
  requestedStartTime: string
  paymentAmount: number
  paymentCurrency: string
  packageName: string
  packageDuration: number
}

interface PaymentClientProps {
  booking: BookingData
  organizationName: string
  organizationSlug: string
}

export default function PaymentClient({
  booking,
  organizationName,
  organizationSlug,
}: PaymentClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const initiatePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // Initialize payment on backend and get authorization URL
      const response = await fetch(`/api/public/airtime/${organizationSlug}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: booking.bookingRef }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      // Redirect to Paystack payment page
      if (data.data.authorization_url) {
        window.location.href = data.data.authorization_url
      } else {
        throw new Error('Payment URL not received. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
              <CreditCard className="w-8 h-8 text-emerald-300" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-slate-400">{organizationName}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Booking Summary */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-lg font-bold text-white mb-4">Booking Summary</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">{booking.programTitle}</p>
                  <p className="text-sm text-slate-400">{booking.packageName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-purple-400" />
                {formatDuration(booking.packageDuration)}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white">{formatDate(booking.requestedDate)}</p>
                  <p className="text-sm text-slate-400">at {booking.requestedStartTime}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Booking Reference</span>
                <span className="font-mono text-white">{booking.bookingRef}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Amount */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-300/80 text-sm">Amount to Pay</p>
              <p className="text-3xl font-bold text-white">
                {booking.paymentCurrency} {booking.paymentAmount.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-emerald-400/50" />
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <h3 className="text-sm font-medium text-slate-400 mb-4">Accepted Payment Methods</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
              <Smartphone className="w-5 h-5 text-amber-400" />
              <span className="text-slate-300 text-sm">MTN MoMo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
              <Smartphone className="w-5 h-5 text-red-400" />
              <span className="text-slate-300 text-sm">Vodafone Cash</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300 text-sm">AirtelTigo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <span className="text-slate-300 text-sm">Card</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4 mb-6">
          <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-slate-400">
            Your payment is secured by Paystack. We never store your payment details.
          </p>
        </div>

        {/* Pay Button */}
        <button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Redirecting to payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay {booking.paymentCurrency} {booking.paymentAmount.toFixed(2)}
            </>
          )}
        </button>

        {/* Check Status Link */}
        <p className="text-center mt-6 text-sm text-slate-500">
          Already paid?{' '}
          <a
            href={`/book/status/${booking.bookingRef}`}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Check booking status
          </a>
        </p>
      </div>
    </div>
  )
}
