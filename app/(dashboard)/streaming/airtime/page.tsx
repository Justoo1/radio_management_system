/**
 * Airtime Bookings Management Page
 * View and manage all airtime booking requests
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Package,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Radio,
  Play,
  Pause,
  ChevronDown,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'

interface AirtimeBooking {
  id: string
  bookingRef: string
  guestName: string
  guestEmail: string
  guestPhone: string
  guestType: string
  programTitle: string
  programDescription: string | null
  requestedDate: string
  requestedStartTime: string
  approvedDate: string | null
  approvedStartTime: string | null
  approvedEndTime: string | null
  status: string
  paymentStatus: string
  paymentAmount: number
  paymentCurrency: string
  paidAt: string | null
  djUsername: string | null
  djPassword: string | null
  createdAt: string
  package: {
    name: string
    durationMinutes: number
    price: number
  }
}

interface ApproveModalData {
  booking: AirtimeBooking
  approvedDate: string
  approvedStartTime: string
  adminNotes: string
}

interface RejectModalData {
  booking: AirtimeBooking
  reason: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING_PAYMENT: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  PAYMENT_FAILED: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  PENDING_REVIEW: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
  APPROVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  SCHEDULED: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  LIVE: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  COMPLETED: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
  NO_SHOW: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
  CANCELLED: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
  EXPIRED: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PAYMENT_FAILED: 'Payment Failed',
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  LIVE: 'Live Now',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

const GUEST_TYPE_LABELS: Record<string, string> = {
  PREACHER: 'Preacher',
  ADVERTISER: 'Advertiser',
  TALK_SHOW_HOST: 'Talk Show Host',
  MUSICIAN: 'Musician',
  PODCAST_HOST: 'Podcast Host',
  OTHER: 'Other',
}

export default function AirtimeBookingsPage() {
  const [bookings, setBookings] = useState<AirtimeBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const limit = 20

  // Modals
  const [approveModal, setApproveModal] = useState<ApproveModalData | null>(null)
  const [rejectModal, setRejectModal] = useState<RejectModalData | null>(null)
  const [viewBooking, setViewBooking] = useState<AirtimeBooking | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      params.append('page', page.toString())
      params.append('limit', limit.toString())

      const response = await fetch(`/api/airtime/bookings?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch bookings')

      const data = await response.json()
      setBookings(data.data || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleApprove = async () => {
    if (!approveModal) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/airtime/bookings/${approveModal.booking.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedDate: approveModal.approvedDate,
          approvedStartTime: approveModal.approvedStartTime,
          adminNotes: approveModal.adminNotes || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to approve booking')
      }

      const data = await response.json()
      setSuccess('Booking approved successfully! DJ credentials have been generated.')
      setTimeout(() => setSuccess(null), 5000)
      setApproveModal(null)
      fetchBookings()

      // Show credentials
      if (data.data?.credentials) {
        setViewBooking({
          ...approveModal.booking,
          ...data.data,
          djUsername: data.data.credentials.username,
          djPassword: data.data.credentials.password,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve booking')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/airtime/bookings/${rejectModal.booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectModal.reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject booking')
      }

      setSuccess('Booking rejected. Refund will be processed if payment was completed.')
      setTimeout(() => setSuccess(null), 5000)
      setRejectModal(null)
      fetchBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject booking')
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openApproveModal = (booking: AirtimeBooking) => {
    setApproveModal({
      booking,
      approvedDate: booking.requestedDate.split('T')[0],
      approvedStartTime: booking.requestedStartTime,
      adminNotes: '',
    })
  }

  const openRejectModal = (booking: AirtimeBooking) => {
    setRejectModal({
      booking,
      reason: '',
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const pendingReviewCount = bookings.filter(b => b.status === 'PENDING_REVIEW').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Airtime Bookings
              </h1>
              <p className="text-slate-400 text-lg">Manage remote airtime booking requests</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/streaming/airtime/packages"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                <Package className="w-4 h-4" />
                Manage Packages
              </Link>
              <button
                onClick={() => fetchBookings()}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <p className="text-slate-400 text-sm">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xl rounded-xl p-4 border border-blue-500/30">
              <p className="text-blue-300 text-sm">Pending Review</p>
              <p className="text-2xl font-bold text-blue-200">{pendingReviewCount}</p>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xl rounded-xl p-4 border border-emerald-500/30">
              <p className="text-emerald-300 text-sm">Approved Today</p>
              <p className="text-2xl font-bold text-emerald-200">
                {bookings.filter(b => b.status === 'APPROVED' || b.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="bg-red-500/20 backdrop-blur-xl rounded-xl p-4 border border-red-500/30">
              <p className="text-red-300 text-sm">Live Now</p>
              <p className="text-2xl font-bold text-red-200">
                {bookings.filter(b => b.status === 'LIVE').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or booking ref..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
              <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Bookings Found</h3>
              <p className="text-slate-400 mb-6">
                {statusFilter || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'No airtime booking requests yet. Share your booking page with potential guests.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusStyle = STATUS_COLORS[booking.status] || STATUS_COLORS.PENDING_PAYMENT
              const isPendingReview = booking.status === 'PENDING_REVIEW'
              const isLive = booking.status === 'LIVE'

              return (
                <div
                  key={booking.id}
                  className={`group relative ${isPendingReview ? 'ring-2 ring-blue-500/50' : ''} ${isLive ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-cyan-500/30 transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Booking Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                            {isLive && <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
                            {STATUS_LABELS[booking.status]}
                          </span>
                          <span className="text-slate-500 text-sm font-mono">{booking.bookingRef}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{booking.programTitle}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {booking.guestName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {booking.guestEmail}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {booking.package.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                            {formatDate(booking.approvedDate || booking.requestedDate)}
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-4 h-4 text-purple-400" />
                            {booking.approvedStartTime || booking.requestedStartTime}
                            {booking.approvedEndTime && ` - ${booking.approvedEndTime}`}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-300">
                            <DollarSign className="w-4 h-4" />
                            {booking.paymentCurrency} {booking.paymentAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewBooking(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>

                        {isPendingReview && (
                          <>
                            <button
                              onClick={() => openApproveModal(booking)}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/30 rounded-xl text-emerald-300 transition-all duration-300"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(booking)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 rounded-xl text-red-300 transition-all duration-300"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* View Booking Modal */}
        {viewBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{viewBooking.programTitle}</h2>
                  <p className="text-slate-400 font-mono text-sm">{viewBooking.bookingRef}</p>
                </div>
                <button
                  onClick={() => setViewBooking(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[viewBooking.status]?.bg} ${STATUS_COLORS[viewBooking.status]?.text} ${STATUS_COLORS[viewBooking.status]?.border} border`}>
                    {STATUS_LABELS[viewBooking.status]}
                  </span>
                </div>

                {/* Guest Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Guest Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs">Name</p>
                      <p className="text-white">{viewBooking.guestName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Type</p>
                      <p className="text-white">{GUEST_TYPE_LABELS[viewBooking.guestType]}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Email</p>
                      <p className="text-white">{viewBooking.guestEmail}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Phone</p>
                      <p className="text-white">{viewBooking.guestPhone}</p>
                    </div>
                  </div>
                </div>

                {/* Program Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Program Details</h3>
                  <div className="space-y-3">
                    {viewBooking.programDescription && (
                      <p className="text-slate-300 text-sm">{viewBooking.programDescription}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs">Package</p>
                        <p className="text-white">{viewBooking.package.name} ({viewBooking.package.durationMinutes} min)</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Requested Date</p>
                        <p className="text-white">{formatDate(viewBooking.requestedDate)} at {viewBooking.requestedStartTime}</p>
                      </div>
                      {viewBooking.approvedDate && (
                        <div>
                          <p className="text-slate-500 text-xs">Approved Schedule</p>
                          <p className="text-emerald-300">
                            {formatDate(viewBooking.approvedDate)} at {viewBooking.approvedStartTime} - {viewBooking.approvedEndTime}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-500 text-xs">Amount</p>
                      <p className="text-white text-lg font-bold">
                        {viewBooking.paymentCurrency} {viewBooking.paymentAmount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Status</p>
                      <p className={`${viewBooking.paymentStatus === 'COMPLETED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {viewBooking.paymentStatus}
                      </p>
                    </div>
                    {viewBooking.paidAt && (
                      <div>
                        <p className="text-slate-500 text-xs">Paid At</p>
                        <p className="text-slate-300">{new Date(viewBooking.paidAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DJ Credentials (if approved) */}
                {viewBooking.djUsername && viewBooking.djPassword && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-emerald-300 mb-3 flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      Broadcast Credentials
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-emerald-400/60 text-xs">Username</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-mono">{viewBooking.djUsername}</p>
                          <button
                            onClick={() => copyToClipboard(viewBooking.djUsername!, 'username')}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedField === 'username' ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-emerald-400/60 text-xs">Password</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-mono">{viewBooking.djPassword}</p>
                          <button
                            onClick={() => copyToClipboard(viewBooking.djPassword!, 'password')}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            {copiedField === 'password' ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10">
                <button
                  onClick={() => setViewBooking(null)}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 font-medium transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Modal */}
        {approveModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Approve Booking</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Confirm the broadcast schedule for {approveModal.booking.guestName}
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Program: <span className="text-white">{approveModal.booking.programTitle}</span></p>
                  <p className="text-slate-400 text-sm">Package: <span className="text-white">{approveModal.booking.package.name} ({approveModal.booking.package.durationMinutes} min)</span></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Broadcast Date *
                    </label>
                    <input
                      type="date"
                      value={approveModal.approvedDate}
                      onChange={(e) => setApproveModal({ ...approveModal, approvedDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={approveModal.approvedStartTime}
                      onChange={(e) => setApproveModal({ ...approveModal, approvedStartTime: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={approveModal.adminNotes}
                    onChange={(e) => setApproveModal({ ...approveModal, adminNotes: e.target.value })}
                    rows={3}
                    placeholder="Any notes for this booking..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm text-blue-300">
                  <p>A DJ account will be created automatically with schedule enforcement. The guest will only be able to broadcast during the approved time slot.</p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setApproveModal(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve & Create Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-lg">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Reject Booking</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Provide a reason for rejecting {rejectModal.booking.guestName}&apos;s booking
                </p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Program: <span className="text-white">{rejectModal.booking.programTitle}</span></p>
                  <p className="text-slate-400 text-sm">Amount: <span className="text-white">{rejectModal.booking.paymentCurrency} {rejectModal.booking.paymentAmount.toFixed(2)}</span></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectModal.reason}
                    onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                    rows={4}
                    placeholder="Please provide a reason for rejection (min 10 characters)..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                  />
                  <p className="text-slate-500 text-xs mt-1">{rejectModal.reason.length}/500 characters</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-300">
                  <p>If payment was completed, a refund will be automatically initiated through Paystack. The guest will receive an email notification.</p>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={submitting || rejectModal.reason.length < 10}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Reject & Refund
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
