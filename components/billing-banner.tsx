'use client'

/**
 * Billing Banner Component
 * Shows subscription payment notifications to users
 * Updated to use SubscriptionPayment instead of Bill model
 */

import { useState, useEffect } from 'react'
import { AlertCircle, X, CreditCard, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { getPendingBills } from '@/app/actions/bills'

interface PaymentInfo {
  id: string
  amount: number
  currency: string
  status: string
  dueDate: string
  periodEnd: string
  planName: string
  description: string | null
}

export function BillingBanner() {
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const result = await getPendingBills()
        if (result.success && result.bills) {
          // Map to ensure type compatibility
          setPayments(result.bills.map(bill => ({
            id: bill.id,
            amount: bill.amount,
            currency: bill.currency,
            status: bill.status,
            dueDate: bill.dueDate,
            periodEnd: bill.periodEnd,
            planName: bill.planName,
            description: bill.description,
          })))
        }
      } catch (error) {
        console.error('Failed to load payment info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  if (loading || payments.length === 0 || dismissed) {
    return null
  }

  const payment = payments[0]
  const dueDate = new Date(payment.dueDate)
  const now = new Date()
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Determine status based on payment status and due date
  const isOverdue = payment.status === 'OVERDUE' || payment.status === 'FAILED' || daysUntilDue < 0
  const isPastDue = payment.status === 'PAST_DUE'
  const isDueSoon = (payment.status === 'UPCOMING' || payment.status === 'PENDING') && daysUntilDue >= 0 && daysUntilDue <= 7

  // Get appropriate styling
  const getStyleClass = () => {
    if (isOverdue || isPastDue) return 'bg-red-500/10 border-red-500/30'
    if (isDueSoon) return 'bg-orange-500/10 border-orange-500/30'
    return 'bg-blue-500/10 border-blue-500/30'
  }

  const getIconBgClass = () => {
    if (isOverdue || isPastDue) return 'bg-red-500/20'
    if (isDueSoon) return 'bg-orange-500/20'
    return 'bg-blue-500/20'
  }

  const getTitleClass = () => {
    if (isOverdue || isPastDue) return 'text-red-300'
    if (isDueSoon) return 'text-orange-300'
    return 'text-blue-300'
  }

  const getTitle = () => {
    if (isOverdue) return 'Payment Overdue'
    if (isPastDue) return 'Payment Required'
    if (isDueSoon) return 'Payment Due Soon'
    return 'Upcoming Payment'
  }

  const getButtonClass = () => {
    if (isOverdue || isPastDue) return 'bg-red-600 hover:bg-red-700 text-white'
    if (isDueSoon) return 'bg-orange-600 hover:bg-orange-700 text-white'
    return 'bg-blue-600 hover:bg-blue-700 text-white'
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'GHS' ? 'GH₵' : currency
    return `${symbol} ${amount.toLocaleString()}`
  }

  return (
    <div className={`relative mb-6 rounded-xl border p-4 ${getStyleClass()}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className={`p-2 rounded-lg ${getIconBgClass()}`}>
          {isOverdue || isPastDue ? (
            <AlertCircle className={`w-5 h-5 ${isOverdue ? 'text-red-400' : 'text-orange-400'}`} />
          ) : isDueSoon ? (
            <Clock className="w-5 h-5 text-orange-400" />
          ) : (
            <CreditCard className="w-5 h-5 text-blue-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${getTitleClass()}`}>
              {getTitle()}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isOverdue || isPastDue
                  ? 'bg-red-500/20 text-red-300'
                  : isDueSoon
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {payment.planName}
            </span>
          </div>

          <div className="text-sm text-slate-300 space-y-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>
                  <span className="font-semibold text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </span>
                  {' '}subscription renewal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Due: <span className="font-semibold">{dueDate.toLocaleDateString()}</span>
                  {isOverdue && (
                    <span className="ml-2 text-red-400 font-semibold">
                      ({Math.abs(daysUntilDue)} days overdue)
                    </span>
                  )}
                  {isDueSoon && !isOverdue && (
                    <span className="ml-2 text-orange-400 font-semibold">
                      ({daysUntilDue} days remaining)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {payment.description && (
              <p className="text-slate-400 text-xs mt-1">{payment.description}</p>
            )}

            {(isOverdue || isPastDue) && (
              <p className="text-red-400 text-xs mt-1">
                Your premium features have been temporarily disabled. Make a payment to restore access.
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Link
              href="/settings/billing"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${getButtonClass()}`}
            >
              {isOverdue || isPastDue ? 'Pay Now' : 'Make Payment'}
            </Link>

            <Link
              href="/settings/billing"
              className="text-sm text-slate-400 hover:text-slate-300 underline"
            >
              View Billing Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
