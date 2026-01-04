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
  Banknote,
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
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [planChangeNotes, setPlanChangeNotes] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'MOBILE_MONEY',
    paymentProvider: 'HUBTEL',
    mobileNumber: '',
    network: 'MTN',
    referenceNumber: '',
    notes: '',
  })

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

  const handleOpenPlanModal = async () => {
    try {
      setActionLoading(true)
      // Fetch available plans
      const response = await fetch(`/api/admin/organizations/${organizationId}/plan`)
      const data = await response.json()

      if (data.success) {
        setPlans(data.plans)
        setSelectedPlanId(organization?.subscription?.plan.id || '')
        setShowPlanModal(true)
      } else {
        alert('Failed to fetch subscription plans')
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      alert('Failed to fetch subscription plans')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePlan = async () => {
    if (!selectedPlanId) {
      alert('Please select a plan')
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/organizations/${organizationId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          notes: planChangeNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh organization data
        const orgResponse = await getOrganizationDetailsAdmin(organizationId)
        setOrganization(orgResponse.organization)
        setShowPlanModal(false)
        setSelectedPlanId('')
        setPlanChangeNotes('')
        alert('Subscription plan updated successfully!')
      } else {
        alert(data.error || 'Failed to update subscription plan')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Failed to update subscription plan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenPaymentModal = () => {
    // Pre-fill amount with subscription plan price
    if (organization?.subscription?.plan?.price) {
      setPaymentData((prev) => ({
        ...prev,
        amount: organization.subscription!.plan.price.toString(),
      }))
    }
    setShowPaymentModal(true)
  }

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          ...paymentData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh organization data
        const orgResponse = await getOrganizationDetailsAdmin(organizationId)
        setOrganization(orgResponse.organization)
        setShowPaymentModal(false)
        setPaymentData({
          amount: '',
          paymentMethod: 'MOBILE_MONEY',
          paymentProvider: 'HUBTEL',
          mobileNumber: '',
          network: 'MTN',
          referenceNumber: '',
          notes: '',
        })
        alert('Payment recorded successfully!')
      } else {
        alert(data.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
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
    <div className="space-y-6 sm:space-y-8 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link
          href="/"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{organization.name}</h1>
          <p className="text-sm sm:text-base text-slate-400 truncate">{organization.email}</p>
        </div>
      </div>

      {/* Status and Action Buttons */}
      <div className="flex flex-col gap-4">
        <span
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm w-fit ${getStatusColor(
            organization.status
          )}`}
        >
          {organization.status === 'ACTIVE' && <CheckCircle className="w-4 h-4" />}
          {organization.status === 'SUSPENDED' && <XCircle className="w-4 h-4" />}
          {organization.status === 'EXPIRED' && <AlertCircle className="w-4 h-4" />}
          {organization.status}
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
          <button
            onClick={handleOpenPaymentModal}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
          >
            Record Payment
          </button>

          <button
            onClick={handleOpenPlanModal}
            disabled={actionLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
          >
            Change Plan
          </button>

          <Link
            href={`/organizations/${organizationId}/features`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors text-center text-sm"
          >
            Manage Features
          </Link>

          {organization.status !== 'ACTIVE' && (
            <button
              onClick={handleActivate}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'Processing...' : 'Activate'}
            </button>
          )}

          {organization.status !== 'SUSPENDED' && (
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm"
            >
              Suspend
            </button>
          )}
        </div>
      </div>

      {/* Organization Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Owner Info */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            Organization Owner
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Name</p>
              <p className="font-semibold text-white text-sm sm:text-base break-words">
                {organization.owner?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Email</p>
              <p className="font-semibold text-white text-sm sm:text-base break-all">{organization.owner?.email}</p>
            </div>
            {organization.owner?.phone && (
              <div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">Phone</p>
                <p className="font-semibold text-white text-sm sm:text-base">{organization.owner.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Registered</p>
              <p className="font-semibold text-white text-sm sm:text-base">
                {new Date(organization.owner?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Trial/Subscription Info */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
            Trial & Subscription
          </h2>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-slate-400 mb-1">Trial End Date</p>
              <p className="font-semibold text-white text-sm sm:text-base">
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
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Plan</p>
                  <p className="font-semibold text-white text-sm sm:text-base">
                    {organization.subscription.plan.name} - GHS{' '}
                    {organization.subscription.plan.price}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Subscription Status</p>
                  <p className="font-semibold text-white text-sm sm:text-base">
                    {organization.subscription.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-1">Period End</p>
                  <p className="font-semibold text-white text-sm sm:text-base">
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
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          Team Members ({organization.users.length})
        </h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-slate-300">
                    Name
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-slate-300">
                    Email
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-slate-300">
                    Status
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-slate-300 hidden sm:table-cell">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {organization.users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white font-semibold">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-300 break-all">{user.email}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
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
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-slate-400 hidden sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          Recent Activity
        </h2>

        <div className="space-y-2 sm:space-y-3">
          {organization.activityLogs.length > 0 ? (
            organization.activityLogs.map((log) => (
              <div key={log.id} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 bg-white/5 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-xs sm:text-sm break-words">{log.action}</p>
                  <p className="text-xs text-slate-400 mt-1 break-words">{log.description}</p>
                </div>
                <div className="text-xs text-slate-500 sm:text-right flex-shrink-0">
                  <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                  <div className="hidden sm:block">{new Date(log.createdAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-xs sm:text-sm">No activity recorded yet</p>
          )}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Suspend Organization</h2>
            </div>

            <p className="text-sm sm:text-base text-slate-400 mb-4">
              Are you sure you want to suspend {organization.name}? This will temporarily prevent access to the platform.
            </p>

            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                Reason for Suspension
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g., Non-payment, Terms violation, etc."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="w-full sm:flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={actionLoading || !deactivateReason.trim()}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Change Subscription Plan</h2>
            </div>

            <p className="text-sm sm:text-base text-slate-400 mb-4">
              Select a new subscription plan for {organization.name}
            </p>

            {/* Current Plan */}
            {organization.subscription && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-400">Current Plan</p>
                <p className="font-semibold text-white text-sm sm:text-base">
                  {organization.subscription.plan.name} - GHS{' '}
                  {organization.subscription.plan.price}/month
                </p>
              </div>
            )}

            {/* Plan Selection */}
            <div className="mb-4 space-y-2 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                Select New Plan
              </label>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPlanId === plan.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-base sm:text-lg">{plan.name}</h3>
                    <div className="text-right">
                      <p className="text-lg sm:text-2xl font-bold text-white">
                        GHS {plan.price}
                      </p>
                      <p className="text-xs text-slate-400">per month</p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3">{plan.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-slate-300">
                      <span className="text-slate-500">Users:</span> {plan.maxUsers}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">Clients:</span> {plan.maxClients}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">SMS/month:</span> {plan.maxSMSPerMonth}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-slate-500">Storage:</span> {plan.maxStorageGB}GB
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={planChangeNotes}
                onChange={(e) => setPlanChangeNotes(e.target.value)}
                placeholder="e.g., Upgraded due to growth, Client request, etc."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowPlanModal(false)
                  setSelectedPlanId('')
                  setPlanChangeNotes('')
                }}
                className="w-full sm:flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={actionLoading || !selectedPlanId}
                className="w-full sm:flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Updating...' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-white">Record Payment</h2>
            </div>

            <p className="text-sm sm:text-base text-slate-400 mb-4">
              Record a subscription payment for {organization.name}
            </p>

            {/* Payment Form */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                  Amount (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-green-500 outline-none [&>option]:bg-slate-800 [&>option]:text-white"
                >
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              {paymentData.paymentMethod === 'MOBILE_MONEY' && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                      Network
                    </label>
                    <select
                      value={paymentData.network}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, network: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-green-500 outline-none [&>option]:bg-slate-800 [&>option]:text-white"
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="VODAFONE">Vodafone Cash</option>
                      <option value="AIRTELTIGO">AirtelTigo Money</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={paymentData.mobileNumber}
                      onChange={(e) =>
                        setPaymentData({ ...paymentData, mobileNumber: e.target.value })
                      }
                      placeholder="0XX XXX XXXX"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.referenceNumber}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, referenceNumber: e.target.value })
                  }
                  placeholder="Transaction reference"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-white mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                  placeholder="Additional notes about this payment"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentData({
                    amount: '',
                    paymentMethod: 'MOBILE_MONEY',
                    paymentProvider: 'HUBTEL',
                    mobileNumber: '',
                    network: 'MTN',
                    referenceNumber: '',
                    notes: '',
                  })
                }}
                className="w-full sm:flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={actionLoading || !paymentData.amount}
                className="w-full sm:flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
