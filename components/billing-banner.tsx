'use client'

/**
 * Billing Banner Component
 * Shows pending/overdue bill notifications to users
 */

import { useState, useEffect } from 'react'
import { AlertCircle, X, CreditCard, Calendar } from 'lucide-react'
import Link from 'next/link'
import { getPendingBills } from '@/app/actions/bills'

interface Bill {
  id: string
  amount: number
  billingMonth: number
  billingYear: number
  dueDate: string
  status: string
  description: string | null
}

export function BillingBanner() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const loadBills = async () => {
      try {
        const result = await getPendingBills()
        if (result.success && result.bills) {
          setBills(result.bills)
        }
      } catch (error) {
        console.error('Failed to load bills:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [])

  if (loading || bills.length === 0 || dismissed) {
    return null
  }

  const nextBill = bills[0]
  const dueDate = new Date(nextBill.dueDate)
  const now = new Date()
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysUntilDue < 0
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div
      className={`relative mb-6 rounded-xl border p-4 ${
        isOverdue
          ? 'bg-red-500/10 border-red-500/30'
          : isDueSoon
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-blue-500/10 border-blue-500/30'
      }`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div
          className={`p-2 rounded-lg ${
            isOverdue
              ? 'bg-red-500/20'
              : isDueSoon
              ? 'bg-orange-500/20'
              : 'bg-blue-500/20'
          }`}
        >
          {isOverdue || isDueSoon ? (
            <AlertCircle
              className={`w-5 h-5 ${
                isOverdue ? 'text-red-400' : 'text-orange-400'
              }`}
            />
          ) : (
            <CreditCard className="w-5 h-5 text-blue-400" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold ${
                isOverdue
                  ? 'text-red-300'
                  : isDueSoon
                  ? 'text-orange-300'
                  : 'text-blue-300'
              }`}
            >
              {isOverdue
                ? 'Payment Overdue'
                : isDueSoon
                ? 'Payment Due Soon'
                : 'Upcoming Payment'}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isOverdue
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-orange-500/20 text-orange-300'
              }`}
            >
              {nextBill.status}
            </span>
          </div>

          <div className="text-sm text-slate-300 space-y-1">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>
                  <span className="font-semibold text-white">GH₵ {nextBill.amount.toLocaleString()}</span>
                  {' '}for {monthNames[nextBill.billingMonth - 1]} {nextBill.billingYear}
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

            {nextBill.description && (
              <p className="text-slate-400 text-xs mt-1">{nextBill.description}</p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Link
              href="/settings/billing"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                isOverdue
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : isDueSoon
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Make Payment
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
