/**
 * Admin Dashboard
 * Manage all organizations, activate/deactivate accounts
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronRight,
  Calendar,
  DollarSign,
  Loader,
} from 'lucide-react'
import { getAllOrganizations, getAdminDashboardStats } from '@/app/actions/admin'

interface Organization {
  id: string
  name: string
  slug: string
  email: string
  status: string
  owner: { email: string; name: string | null; id: string } | null
  trialEndDate: Date
  isTrialUsed: boolean
  subscription: {
    planName: string
    status: string
  } | null
  createdAt: Date
  updatedAt: Date
}

interface DashboardStats {
  organizations: {
    total: number
    byStatus: {
      trial: number
      active: number
      suspended: number
      expired: number
      cancelled: number
    }
  }
  subscriptions: {
    totalActive: number
    estimatedMonthlyRevenue: number
  }
  alerts: {
    upcomingPayments: number
    expiringTrials: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch dashboard data (developer-only access controlled via middleware/cookie)
        const [statsResponse, orgsResponse] = await Promise.all([
          getAdminDashboardStats(),
          getAllOrganizations({
            search: searchTerm,
            status: statusFilter,
            page: currentPage,
            pageSize: 10,
          }),
        ])

        setStats(statsResponse.stats)
        setOrganizations(orgsResponse.organizations)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      fetchData()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, currentPage])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'TRIAL':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'SUSPENDED':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'EXPIRED':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'CANCELLED':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4" />
      case 'SUSPENDED':
        return <XCircle className="w-4 h-4" />
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage organizations, subscriptions, and payments</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Total Organizations</p>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.organizations.total}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Active Subscriptions</p>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.subscriptions.totalActive}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Monthly Revenue</p>
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">GHS {stats.subscriptions.estimatedMonthlyRevenue.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Payments Due</p>
              <AlertCircle className="w-4 h-4 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.alerts.upcomingPayments}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Expiring Trials</p>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.alerts.expiringTrials}</p>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {stats && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Organization Status Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{stats.organizations.byStatus.trial}</div>
              <p className="text-sm text-slate-400">Trial</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.organizations.byStatus.active}</div>
              <p className="text-sm text-slate-400">Active</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">{stats.organizations.byStatus.expired}</div>
              <p className="text-sm text-slate-400">Expired</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-1">{stats.organizations.byStatus.suspended}</div>
              <p className="text-sm text-slate-400">Suspended</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-400 mb-1">{stats.organizations.byStatus.cancelled}</div>
              <p className="text-sm text-slate-400">Cancelled</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations by name, email, or slug..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
          >
            <option value="">All Status</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {organizations.length > 0 ? (
                organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-white">{org.name}</p>
                        <p className="text-sm text-slate-400">{org.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-300">
                        {org.owner?.name || 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-slate-300">
                        {org.subscription?.planName || 'Professional'}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          org.status
                        )}`}
                      >
                        {getStatusIcon(org.status)}
                        {org.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <a
                        href={`/organizations/${org.id}`}
                        className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Showing {organizations.length > 0 ? (currentPage - 1) * 10 + 1 : 0} to{' '}
          {Math.min(currentPage * 10, stats?.organizations.total || 0)} of{' '}
          {stats?.organizations.total || 0} organizations
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/30 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
            disabled={organizations.length < 10}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-white/30 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="font-semibold text-blue-300 mb-2">Upcoming Payments</h3>
          <p className="text-sm text-blue-200 mb-2">
            {stats?.alerts.upcomingPayments || 0} organizations have payments due within the next 7 days
          </p>
          <a href="/alerts/payments" className="text-blue-300 hover:text-blue-200 text-sm font-semibold">
            View Details →
          </a>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <h3 className="font-semibold text-orange-300 mb-2">Expiring Trials</h3>
          <p className="text-sm text-orange-200 mb-2">
            {stats?.alerts.expiringTrials || 0} trial organizations will expire within the next 7 days
          </p>
          <a href="/alerts/trials" className="text-orange-300 hover:text-orange-200 text-sm font-semibold">
            View Details →
          </a>
        </div>
      </div>
    </div>
  )
}
