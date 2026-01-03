/**
 * Admin Revenue Management Page
 * Detailed revenue tracking, subscription payments, and financial analytics
 */

'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Loader,
} from 'lucide-react'

interface RevenueData {
  summary: {
    totalRevenue: number
    monthlyRecurring: number
    activeSubscriptions: number
    averageRevenuePerUser: number
    growthRate: number
  }
  revenueByPlan: {
    plan: string
    count: number
    revenue: number
  }[]
  recentPayments: {
    id: string
    organizationName: string
    organizationId: string
    planName: string
    amount: number
    status: string
    date: Date
    paymentMethod: string
  }[]
  monthlyTrend: {
    month: string
    revenue: number
    subscriptions: number
  }[]
}

export default function RevenueManagementPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchRevenueData()
  }, [dateRange])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/revenue?range=${dateRange}`)
      const data = await response.json()

      if (data.success) {
        setRevenue(data.revenue)
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportRevenueData = () => {
    // Export to CSV
    const csv = [
      ['Date', 'Organization', 'Plan', 'Amount', 'Status', 'Payment Method'].join(','),
      ...(revenue?.recentPayments || []).map((payment) =>
        [
          new Date(payment.date).toLocaleDateString(),
          payment.organizationName,
          payment.planName,
          payment.amount,
          payment.status,
          payment.paymentMethod,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const filteredPayments = revenue?.recentPayments.filter((payment) => {
    const matchesSearch =
      searchTerm === '' ||
      payment.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.planName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === '' || payment.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  if (loading && !revenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Revenue Management</h1>
          <p className="text-slate-400">Track subscription revenue and payment analytics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <button
            onClick={exportRevenueData}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Total Revenue</p>
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              GHS {revenue.summary.totalRevenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 text-xs">
              {revenue.summary.growthRate >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">
                    +{revenue.summary.growthRate.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">
                    {revenue.summary.growthRate.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="text-slate-500">vs last period</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Monthly Recurring</p>
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              GHS {revenue.summary.monthlyRecurring.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500">MRR from active subscriptions</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Active Subscriptions</p>
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {revenue.summary.activeSubscriptions}
            </p>
            <p className="text-xs text-slate-500">Paying organizations</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">ARPU</p>
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              GHS {revenue.summary.averageRevenuePerUser.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500">Average Revenue Per User</p>
          </div>
        </div>
      )}

      {/* Revenue by Plan */}
      {revenue && revenue.revenueByPlan.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Revenue by Subscription Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {revenue.revenueByPlan.map((plan) => (
              <div
                key={plan.plan}
                className="bg-white/5 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{plan.plan}</h3>
                  <span className="text-xs text-slate-400">{plan.count} subs</span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">
                  GHS {plan.revenue.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{
                      width: `${(plan.revenue / revenue.summary.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {((plan.revenue / revenue.summary.totalRevenue) * 100).toFixed(1)}% of total
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization or plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Recent Payments Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={`/organizations/${payment.organizationId}`}
                        className="font-semibold text-white hover:text-indigo-400 transition-colors"
                      >
                        {payment.organizationName}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {payment.planName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                      GHS {payment.amount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
