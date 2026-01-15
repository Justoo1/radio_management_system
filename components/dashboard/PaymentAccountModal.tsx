/**
 * Payment Account Setup Modal
 * Shows a modal reminder when organization hasn't setup payment account
 * Can be dismissed temporarily
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CreditCard, X } from 'lucide-react'

interface PaymentAccountModalProps {
  hasPaymentAccount: boolean
  showOnPages?: string[] // Pages where modal should appear (e.g., ['streaming', 'airtime'])
  currentPage?: string
}

export default function PaymentAccountModal({
  hasPaymentAccount,
  showOnPages = [],
  currentPage = ''
}: PaymentAccountModalProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Check if modal was dismissed in session storage
    const dismissedUntil = sessionStorage.getItem('payment-account-modal-dismissed')
    if (dismissedUntil) {
      const dismissTime = parseInt(dismissedUntil)
      if (Date.now() < dismissTime) {
        setDismissed(true)
        return
      }
    }

    // Show modal if:
    // - Payment account not setup
    // - Not dismissed
    // - Either no page filter OR current page is in the show list
    const shouldShow =
      !hasPaymentAccount &&
      !dismissed &&
      (showOnPages.length === 0 || showOnPages.includes(currentPage))

    if (shouldShow) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [hasPaymentAccount, dismissed, showOnPages, currentPage])

  const handleDismiss = () => {
    // Dismiss for 1 hour
    const dismissUntil = Date.now() + (60 * 60 * 1000)
    sessionStorage.setItem('payment-account-modal-dismissed', dismissUntil.toString())
    setDismissed(true)
    setIsOpen(false)
  }

  const handleRemindLater = () => {
    // Dismiss for 24 hours
    const dismissUntil = Date.now() + (24 * 60 * 60 * 1000)
    sessionStorage.setItem('payment-account-modal-dismissed', dismissUntil.toString())
    setDismissed(true)
    setIsOpen(false)
  }

  if (!isOpen || hasPaymentAccount) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20 max-w-lg w-full p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-3">
              Payment Account Required
            </h2>
            <p className="text-slate-300 mb-2">
              To start accepting airtime bookings from guests, you need to setup your payment account.
            </p>
            <p className="text-slate-400 text-sm">
              This ensures that payments from airtime bookings go directly to your bank account or mobile money wallet.
            </p>
          </div>

          {/* Features list */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-3">Why setup payment account?</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>Receive 100% of airtime booking payments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>Automatic settlement by Paystack</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>Enable guests to book and pay online</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/settings/payment-account"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-amber-500/30"
            >
              <CreditCard className="w-5 h-5" />
              Setup Payment Account Now
            </Link>
            <button
              onClick={handleRemindLater}
              className="w-full text-slate-400 hover:text-slate-300 text-sm py-2 transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
