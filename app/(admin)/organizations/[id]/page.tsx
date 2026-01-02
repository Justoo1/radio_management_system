/**
 * Admin Organization Details Page
 * View and manage individual organization
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Activity,
  Loader,
} from 'lucide-react'
import Link from 'next/link'
import {
  getOrganizationDetailsAdmin,
  activateOrganizationAdmin,
  deactivateOrganizationAdmin,
} from '@/app/actions/admin'

interface SubscriptionPlan {
  name: string
  id: string
  maxUsers: number
  maxClients: number
  maxSMSPerMonth: number
  maxStorageGB: number
  createdAt: Date
  updatedAt: Date
  description: string | null
  price: any
  features: any
  sortOrder: number
}

interface OrganizationDetails {
  id: string
  name: string
  email: string
  status: string
  trialEndDate: Date
  isTrialUsed: boolean
  owner: {
    id: string
    email: string
    name: string | null
    phone: string | null
    createdAt: Date
  } | null
  subscription: {
    id: string
    plan: SubscriptionPlan
    status: string
    currentPeriodEnd: Date
    nextPaymentDate: Date | null
    payments: any[]
  } | null
  users: Array<{
    id: string
    email: string
    name: string | null
    status: string
    createdAt: Date
  }>
  activityLogs: Array<{
    id: string
    action: string
    description: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

export default function OrganizationDetailsPage() {
  const params = useParams()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<OrganizationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)

        // Developer access is controlled via middleware/proxy
        const response = await getOrganizationDetailsAdmin(organizationId)
        setOrganization(response.organization)
      } catch (error) {
        console.error('Error fetching organization:', error)
      } finally {
        setLoading(false)
      }
    }

    if (organizationId) {
      fetchOrganization()
    }
  }, [organizationId])

  const handleActivate = async () => {
    try {
      setActionLoading(true)
      await activateOrganizationAdmin(organizationId)
      // Refresh data
      const response = await getOrganizationDetailsAdmin(organizationId)
      setOrganization(response.organization)
      alert('Organization activated successfully!')
    } catch (error) {
      console.error('Error activating organization:', error)
      alert('Failed to activate organization')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) {
      alert('Please provide a reason for deactivation')
      return
    }

    try {
      setActionLoading(true)
      await deactivateOrganizationAdmin(organizationId, deactivateReason)
      // Refresh data
      const response = await getOrganizationDetailsAdmin(organizationId)
      setOrganization(response.organization)
      setShowDeactivateModal(false)
      setDeactivateReason('')
      alert('Organization deactivated successfully!')
    } catch (error) {
      console.error('Error deactivating organization:', error)
      alert('Failed to deactivate organization')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/20 text-emerald-300'
      case 'TRIAL':
        return 'bg-blue-500/20 text-blue-300'
      case 'SUSPENDED':
        return 'bg-red-500/20 text-red-300'
      case 'EXPIRED':
        return 'bg-orange-500/20 text-orange-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading organization details...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-4">Organization not found</p>
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const trialDaysRemaining = Math.ceil(
    (new Date(organization.trialEndDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
          <p className="text-slate-400">{organization.email}</p>
        </div>
      </div>

      {/* Status and Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${getStatusColor(
            organization.status
          )}`}
        >
          {organization.status === 'ACTIVE' && <CheckCircle className="w-4 h-4" />}
          {organization.status === 'SUSPENDED' && <XCircle className="w-4 h-4" />}
          {organization.status === 'EXPIRED' && <AlertCircle className="w-4 h-4" />}
          {organization.status}
        </span>

        <div className="flex gap-2 ml-auto">
          <Link
            href={`/organizations/${organizationId}/features`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
          >
            Manage Features
          </Link>

          {organization.status !== 'ACTIVE' && (
            <button
              onClick={handleActivate}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Activate'}
            </button>
          )}

          {organization.status !== 'SUSPENDED' && (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Organization Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Owner Info */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Organization Owner
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-1">Name</p>
              <p className="font-semibold text-white">
                {organization.owner?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Email</p>
              <p className="font-semibold text-white">{organization.owner?.email}</p>
            </div>
            {organization.owner?.phone && (
              <div>
                <p className="text-sm text-slate-400 mb-1">Phone</p>
                <p className="font-semibold text-white">{organization.owner.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-400 mb-1">Registered</p>
              <p className="font-semibold text-white">
                {new Date(organization.owner?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Trial/Subscription Info */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Trial & Subscription
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-1">Trial End Date</p>
              <p className="font-semibold text-white">
                {new Date(organization.trialEndDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {trialDaysRemaining > 0
                  ? `${trialDaysRemaining} days remaining`
                  : 'Expired'}
              </p>
            </div>
            {organization.subscription && (
              <>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Plan</p>
                  <p className="font-semibold text-white">
                    {organization.subscription.plan.name} - GHS{' '}
                    {organization.subscription.plan.price}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Subscription Status</p>
                  <p className="font-semibold text-white">
                    {organization.subscription.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Period End</p>
                  <p className="font-semibold text-white">
                    {new Date(
                      organization.subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Users in Organization */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          Team Members ({organization.users.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {organization.users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-white font-semibold">
                    {user.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Recent Activity
        </h2>

        <div className="space-y-3">
          {organization.activityLogs.length > 0 ? (
            organization.activityLogs.map((log) => (
              <div key={log.id} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{log.action}</p>
                  <p className="text-xs text-slate-400 mt-1">{log.description}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(log.createdAt).toLocaleDateString()} at{' '}
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-sm">No activity recorded yet</p>
          )}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Suspend Organization</h2>
            </div>

            <p className="text-slate-400 mb-4">
              Are you sure you want to suspend {organization.name}? This will temporarily prevent access to the platform.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-white mb-2">
                Reason for Suspension
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g., Non-payment, Terms violation, etc."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading || !deactivateReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
