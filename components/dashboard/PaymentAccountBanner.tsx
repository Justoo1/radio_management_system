/**
 * Payment Account Setup Banner
 * Shows a reminder when organization hasn't setup payment account
 */

'use client'

import Link from 'next/link'
import { AlertCircle, CreditCard, X } from 'lucide-react'
import { useState } from 'react'

interface PaymentAccountBannerProps {
  hasPaymentAccount: boolean
  dismissible?: boolean
}

export default function PaymentAccountBanner({
  hasPaymentAccount,
  dismissible = false
}: PaymentAccountBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Don't show if account is setup or banner is dismissed
  if (hasPaymentAccount || dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
            Payment Account Setup Required
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            You need to setup your payment account to start accepting airtime bookings.
            Customers won't be able to book airtime slots until this is completed.
          </p>
          <Link
            href="/settings/payment-account"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Setup Payment Account Now
          </Link>
        </div>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
