/**
 * Record Payment Page
 * Record a payment against an invoice
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from 'lucide-react'
import { fetchInvoiceDetails, recordPayment, type InvoiceResponse } from '@/app/actions/financial'

interface PaymentFormData {
  amount: string
  paymentDate: string
  paymentMethod: string
  notes: string
}

interface FormState {
  loading: boolean
  error: string | null
  submitting: boolean
  success: boolean
}

export default function RecordPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null)
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
  })
  const [state, setState] = useState<FormState>({
    loading: true,
    error: null,
    submitting: false,
    success: false,
  })

  // Load invoice details
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))
        const invoiceData = await fetchInvoiceDetails(invoiceId)

        if (!invoiceData) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Invoice not found',
          }))
          return
        }

        // Check if invoice is already paid
        if (invoiceData.status === 'PAID') {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Invoice is already paid',
          }))
          return
        }

        setInvoice(invoiceData)
        setState((prev) => ({ ...prev, loading: false }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load invoice',
        }))
      }
    }

    loadInvoice()
  }, [invoiceId])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setState((prev) => ({ ...prev, error: 'Please enter a valid payment amount' }))
      return
    }

    if (!invoice) {
      setState((prev) => ({ ...prev, error: 'Invoice data not available' }))
      return
    }

    const paymentAmount = parseFloat(formData.amount)
    const balanceRemaining = invoice.balanceRemaining || 0

    if (paymentAmount > balanceRemaining) {
      setState((prev) => ({
        ...prev,
        error: `Payment amount cannot exceed outstanding balance of $${balanceRemaining.toFixed(2)}`,
      }))
      return
    }

    try {
      setState((prev) => ({ ...prev, submitting: true, error: null }))

      await recordPayment(invoiceId, {
        amount: paymentAmount,
        paymentDate: new Date(formData.paymentDate),
        paymentMethod: formData.paymentMethod as 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE' | 'CARD' | 'OTHER',
        notes: formData.notes || null,
      })

      setState((prev) => ({ ...prev, success: true, submitting: false }))

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/invoices/${invoiceId}`)
      }, 2000)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to record payment',
        submitting: false,
      }))
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-blue-400"></div>
          <p className="text-slate-400">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (!invoice || invoice.status === 'PAID') {
    return (
      <div className="min-h-screen">
        <div className="relative z-10 p-6 md:p-8">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoices
          </Link>
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg backdrop-blur">
            {state.error || 'Invoice not found or already paid'}
          </div>
        </div>
      </div>
    )
  }

  const balanceRemaining = invoice.balanceRemaining || 0

  if (state.success) {
    return (
      <div className="min-h-screen">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 max-w-md text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                  <CheckCircle className="w-16 h-16 text-green-400 relative" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Recorded</h2>
              <p className="text-slate-300 mb-6">Your payment has been successfully recorded</p>
              <p className="text-sm text-slate-400">Redirecting you back to the invoice...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/invoices/${invoiceId}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoice
          </Link>
          <h1 className="text-4xl font-bold text-white">Record Payment</h1>
          <p className="text-slate-400 mt-2">{invoice.invoiceNumber}</p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              {/* Error Message */}
              {state.error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{state.error}</p>
                </div>
              )}

              {/* Payment Form */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>

                <div className="space-y-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Payment Amount <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-lg"
                        required
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      Outstanding balance: <span className="text-white font-semibold">${balanceRemaining.toFixed(2)}</span>
                    </p>
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Payment Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentDate: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Payment Method <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [&>option]:bg-slate-900 [&>option]:text-white"
                      required
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      placeholder="Payment reference, method, or additional notes..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Invoice Summary */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-white mb-6">Invoice Summary</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Invoice Number</p>
                    <p className="text-white font-semibold text-lg">{invoice.invoiceNumber}</p>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm text-slate-400 mb-1">Invoice Total</p>
                    <p className="text-white font-semibold text-lg">${invoice.totalAmount.toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 mb-1">Amount Paid</p>
                    <p className="text-emerald-300 font-semibold text-lg">
                      ${((invoice.totalAmount - balanceRemaining) || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
                    <p className="text-sm text-slate-400 mb-1">Outstanding Balance</p>
                    <p className="text-yellow-300 font-bold text-lg">${balanceRemaining.toFixed(2)}</p>
                  </div>

                  {formData.amount && parseFloat(formData.amount) > 0 && (
                    <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                      <p className="text-sm text-slate-400 mb-1">Balance After Payment</p>
                      <p className="text-blue-300 font-bold text-lg">
                        ${Math.max(0, balanceRemaining - parseFloat(formData.amount)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={state.submitting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </button>

                <Link
                  href={`/invoices/${invoiceId}`}
                  className="w-full px-4 py-3 bg-slate-500/20 border border-slate-500/50 text-slate-200 rounded-lg hover:bg-slate-500/30 transition-all duration-200 font-medium text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
