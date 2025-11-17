/**
 * Invoice Management Page
 * List all invoices with filtering, search, and summary metrics
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { fetchInvoices, deleteInvoice, type InvoiceResponse } from '@/app/actions/financial'

interface InvoicesPageState {
  invoices: InvoiceResponse[]
  summary: {
    totalInvoices: number
    totalAmount: number
    totalPaid: number
    totalOutstanding: number
    overdueCount: number
  } | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  } | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    status: string
    page: number
    pageSize: number
  }
}

export default function InvoicesPage() {
  const [state, setState] = useState<InvoicesPageState>({
    invoices: [],
    summary: null,
    pagination: null,
    loading: true,
    error: null,
    filters: {
      search: '',
      status: '',
      page: 1,
      pageSize: 10,
    },
  })

  // Load invoices
  const loadInvoices = async (filters = state.filters) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const response = await fetchInvoices({
        page: filters.page,
        pageSize: filters.pageSize,
        ...(filters.status && { status: filters.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' }),
        ...(filters.search && { search: filters.search }),
      })

      setState((prev) => ({
        ...prev,
        invoices: response.data,
        summary: response.summary,
        pagination: response.pagination,
        loading: false,
        filters,
      }))
    } catch (error) {
      console.error('Failed to load invoices:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load invoices',
      }))
    }
  }

  // Initial load
  useEffect(() => {
    loadInvoices()
  }, [])

  // Handle search
  const handleSearch = (value: string) => {
    const newFilters = { ...state.filters, search: value, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadInvoices(newFilters)
  }

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    const newFilters = { ...state.filters, status, page: 1 }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadInvoices(newFilters)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...state.filters, page }
    setState((prev) => ({ ...prev, filters: newFilters }))
    loadInvoices(newFilters)
  }

  // Handle delete
  const handleDelete = async (invoiceId: string, invoiceNumber: string) => {
    if (
      !confirm(
        `Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`
      )
    ) {
      return
    }

    try {
      await deleteInvoice(invoiceId)
      loadInvoices(state.filters)
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete invoice')
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  // Get status badge gradient
  const getStatusGradient = (status: string): string => {
    const gradients: Record<string, string> = {
      DRAFT: 'from-slate-400 to-slate-600 shadow-slate-500/50',
      SENT: 'from-blue-400 to-blue-600 shadow-blue-500/50',
      PAID: 'from-green-400 to-green-600 shadow-green-500/50',
      OVERDUE: 'from-red-400 to-red-600 shadow-red-500/50',
      CANCELLED: 'from-gray-400 to-gray-600 shadow-gray-500/50',
    }
    return gradients[status] || gradients.DRAFT
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Invoices
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and track your invoices
              </p>
            </div>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/50 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Invoice
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {state.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Total Invoices */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-3 rounded-xl border border-blue-400/30 backdrop-blur">
                    <FileText className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Invoices</p>
                <p className="text-4xl font-bold text-white">
                  {state.summary.totalInvoices}
                </p>
              </div>
            </div>

            {/* Total Amount */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
                    <DollarSign className="w-6 h-6 text-emerald-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Amount</p>
                <p className="text-4xl font-bold text-white">
                  {formatCurrency(state.summary.totalAmount)}
                </p>
              </div>
            </div>

            {/* Total Paid */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-green-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-green-500/30 to-emerald-600/30 p-3 rounded-xl border border-green-400/30 backdrop-blur">
                    <TrendingUp className="w-6 h-6 text-green-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Paid</p>
                <p className="text-4xl font-bold text-emerald-300">
                  {formatCurrency(state.summary.totalPaid)}
                </p>
              </div>
            </div>

            {/* Outstanding */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-yellow-500/30 to-orange-600/30 p-3 rounded-xl border border-yellow-400/30 backdrop-blur">
                    <AlertCircle className="w-6 h-6 text-yellow-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Outstanding</p>
                <p className="text-4xl font-bold text-yellow-300">
                  {formatCurrency(state.summary.totalOutstanding)}
                </p>
              </div>
            </div>

            {/* Overdue */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-to-br from-red-500/30 to-pink-600/30 p-3 rounded-xl border border-red-400/30 backdrop-blur">
                    <AlertCircle className="w-6 h-6 text-red-300" />
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">Overdue</p>
                <p className="text-4xl font-bold text-red-300">
                  {state.summary.overdueCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={state.filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all backdrop-blur"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={state.filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium backdrop-blur"
              >
                <option value="" className="bg-slate-900 text-white">All Statuses</option>
                <option value="DRAFT" className="bg-slate-900 text-white">Draft</option>
                <option value="SENT" className="bg-slate-900 text-white">Sent</option>
                <option value="PAID" className="bg-slate-900 text-white">Paid</option>
                <option value="OVERDUE" className="bg-slate-900 text-white">Overdue</option>
                <option value="CANCELLED" className="bg-slate-900 text-white">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-8 backdrop-blur">
            {state.error}
          </div>
        )}

        {/* Invoices Table */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {state.loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-600 border-t-blue-400"></div>
                <p className="text-slate-400">Loading invoices...</p>
              </div>
            </div>
          ) : state.invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-white text-lg font-medium">No invoices found</p>
              <p className="text-slate-400 text-sm mt-1">
                Create your first invoice to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-gradient-to-r from-white/5 to-white/0">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Balance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {state.invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-white bg-white/10 px-3 py-1 rounded-lg text-sm border border-white/20">
                          {invoice.invoiceNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-200 font-medium">
                          {invoice.client?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">
                        {formatCurrency(Number(invoice.totalAmount))}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getStatusGradient(
                            invoice.status
                          )} text-white shadow-md`}
                        >
                          {invoice.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            invoice.balanceRemaining && invoice.balanceRemaining > 0
                              ? 'text-yellow-300 font-bold'
                              : 'text-emerald-300 font-bold'
                          }
                        >
                          {formatCurrency(invoice.balanceRemaining || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            title="View invoice"
                            className="p-2.5 hover:bg-blue-500/20 rounded-lg transition-all duration-200 text-blue-300 hover:text-blue-200 border border-transparent hover:border-blue-500/50"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {invoice.status === 'DRAFT' && (
                            <Link
                              href={`/invoices/${invoice.id}/edit`}
                              title="Edit invoice"
                              className="p-2.5 hover:bg-purple-500/20 rounded-lg transition-all duration-200 text-purple-300 hover:text-purple-200 border border-transparent hover:border-purple-500/50"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          {invoice.status === 'DRAFT' && (
                            <button
                              onClick={() =>
                                handleDelete(invoice.id, invoice.invoiceNumber)
                              }
                              title="Delete invoice"
                              className="p-2.5 hover:bg-red-500/20 rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 border border-transparent hover:border-red-500/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {state.pagination && state.pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Page <span className="text-white font-bold">{state.pagination.page}</span> of{' '}
              <span className="text-white font-bold">{state.pagination.totalPages}</span> (
              <span className="text-white font-bold">{state.pagination.total}</span> total invoices)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handlePageChange(state.pagination!.page - 1)}
                disabled={state.pagination.page === 1}
                className="px-4 py-2.5 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-slate-300 hover:text-white"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(state.pagination!.page + 1)}
                disabled={!state.pagination.hasMore}
                className="px-4 py-2.5 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 font-medium text-slate-300 hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
