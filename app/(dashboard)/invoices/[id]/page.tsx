/**
 * Invoice Detail Page
 * View invoice details, payments, and manage status
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Download,
  Edit,
  Trash2,
  Plus,
  Loader,
  DollarSign,
  Calendar,
  FileText,
  User,
  CreditCard,
} from 'lucide-react'
import { fetchInvoiceDetails, deleteInvoice, type InvoiceResponse } from '@/app/actions/financial'

interface PageState {
  invoice: InvoiceResponse | null
  loading: boolean
  error: string | null
  deleting: boolean
  downloadingPdf: boolean
}

export default function InvoiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  const [state, setState] = useState<PageState>({
    invoice: null,
    loading: true,
    error: null,
    deleting: false,
    downloadingPdf: false,
  })

  // Load invoice details
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))
        const invoice = await fetchInvoiceDetails(invoiceId)
        setState((prev) => ({
          ...prev,
          invoice,
          loading: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load invoice',
          loading: false,
        }))
      }
    }

    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId])

  // Handle delete
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        setState((prev) => ({ ...prev, deleting: true, error: null }))
        await deleteInvoice(invoiceId)
        router.push('/invoices')
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to delete invoice',
          deleting: false,
        }))
      }
    }
  }

  // Handle PDF download
  const handleDownloadPdf = async () => {
    try {
      setState((prev) => ({ ...prev, downloadingPdf: true, error: null }))

      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)

      if (!response.ok) {
        throw new Error('Failed to download PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${state.invoice?.invoiceNumber || 'invoice'}.pdf`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setState((prev) => ({ ...prev, downloadingPdf: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to download PDF',
        downloadingPdf: false,
      }))
    }
  }

  // Format currency
  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount))
  }

  // Format date
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'from-slate-400 to-slate-600 shadow-slate-500/50',
      SENT: 'from-blue-400 to-blue-600 shadow-blue-500/50',
      PAID: 'from-green-400 to-green-600 shadow-green-500/50',
      OVERDUE: 'from-red-400 to-red-600 shadow-red-500/50',
      CANCELLED: 'from-gray-400 to-gray-600 shadow-gray-500/50',
    }
    return colors[status] || colors.DRAFT
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

  if (!state.invoice) {
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
            {state.error || 'Invoice not found'}
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
            href="/invoices"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Invoices
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">
                {state.invoice.invoiceNumber}
              </h1>
              <p className="text-slate-400 mt-2">
                Invoice for {state.invoice.client?.name || 'Unknown'}
              </p>
            </div>
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${getStatusColor(state.invoice.status)} text-white shadow-md h-fit`}>
              {state.invoice.status}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-6 py-4 rounded-lg mb-8 backdrop-blur">
            {state.error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Information */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Invoice Information</h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Client Info */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-400">Client</label>
                  </div>
                  <p className="text-white ml-7 font-medium">{state.invoice.client?.name || 'Unknown'}</p>
                  {state.invoice.client?.email && (
                    <p className="text-slate-400 ml-7 text-sm">{state.invoice.client.email}</p>
                  )}
                </div>

                {/* Issue Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-400">Issue Date</label>
                  </div>
                  <p className="text-white ml-7 font-medium">{formatDate(state.invoice.issueDate)}</p>
                </div>

                {/* Due Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <label className="text-sm font-medium text-slate-400">Due Date</label>
                  </div>
                  <p className="text-white ml-7 font-medium">{formatDate(state.invoice.dueDate)}</p>
                </div>

                {/* Contract */}
                {state.invoice.contract && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <label className="text-sm font-medium text-slate-400">Contract</label>
                    </div>
                    <p className="text-white ml-7 font-medium">{state.invoice.contract.contractNumber}</p>
                    <p className="text-slate-400 ml-7 text-sm">{state.invoice.contract.title}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Line Items</h2>

              <div className="space-y-4">
                {state.invoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center pb-4 border-b border-white/10 last:border-0">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.description}</p>
                      <p className="text-slate-400 text-sm">
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-emerald-300 font-bold text-lg">{formatCurrency(item.amount || item.quantity * Number(item.unitPrice))}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {state.invoice.notes && (
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
                <p className="text-slate-200 whitespace-pre-wrap">{state.invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-semibold">{formatCurrency(state.invoice.subtotal)}</span>
                </div>

                {state.invoice.taxAmount && Number(state.invoice.taxAmount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax:</span>
                    <span className="text-white font-semibold">{formatCurrency(state.invoice.taxAmount)}</span>
                  </div>
                )}

                {state.invoice.discount && Number(state.invoice.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discount:</span>
                    <span className="text-red-300 font-semibold">-{formatCurrency(state.invoice.discount)}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex justify-between">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-emerald-300">{formatCurrency(state.invoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payments Summary */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Status
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="text-white font-semibold">{formatCurrency(state.invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Outstanding:</span>
                  <span className={Number(state.invoice.balanceRemaining) > 0 ? 'text-yellow-300 font-semibold' : 'text-emerald-300 font-semibold'}>
                    {formatCurrency(state.invoice.balanceRemaining || 0)}
                  </span>
                </div>

                {state.invoice.payments && state.invoice.payments.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-slate-400 mb-3">Recent Payments:</p>
                    <div className="space-y-2">
                      {state.invoice.payments.slice(0, 3).map((payment, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-300">{formatDate(payment.paymentDate)}</span>
                          <span className="text-emerald-300 font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {state.invoice.status === 'DRAFT' && (
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>

                <div className="space-y-3">
                  <Link
                    href={`/invoices/${state.invoice.id}/edit`}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Invoice
                  </Link>

                  <button
                    onClick={handleDelete}
                    disabled={state.deleting}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/50 text-red-200 rounded-lg hover:from-red-500/30 hover:to-red-600/30 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.deleting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Download & Record Payment */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">More Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadPdf}
                  disabled={state.downloadingPdf}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/50 text-blue-200 rounded-lg hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {state.downloadingPdf ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>

                {state.invoice.status !== 'PAID' && (
                  <Link
                    href={`/invoices/${state.invoice.id}/payments/new`}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Record Payment
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
