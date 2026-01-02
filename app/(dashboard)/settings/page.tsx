/**
 * Organization Settings Page
 * Manage organization settings, team members, and subscription
 */

'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Save, AlertCircle, CheckCircle, Users, Trash2, Loader } from 'lucide-react'
import { FormInput } from '@/components/settings/form-input'
import { FormSection } from '@/components/settings/form-section'
import { SettingsCard } from '@/components/settings/settings-card'
import { DeleteOrganizationModal } from '@/components/settings/delete-organization-modal'
import { getOrganizationSettings, updateOrganizationSettings, type TeamMember } from '@/app/actions/settings'

interface SubscriptionInfo {
  planName: string
  planPrice: string
  status: string
  currentPeriodEnd: Date | null
  renewalDate: Date | null
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [formData, setFormData] = useState({
    organizationName: '',
    website: '',
    phone: '',
    email: '',
    country: '',
    timezone: 'Africa/Accra',
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [organizationId, setOrganizationId] = useState<string>('')

  // Load organization data on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getOrganizationSettings()

        if (result.success) {
          const org = result.organization
          setOrganizationId(org.id)
          setFormData({
            organizationName: org.name,
            website: org.website || '',
            phone: org.phone || '',
            email: org.email,
            country: org.country,
            timezone: 'Africa/Accra', // Could be stored in database later
          })
          setTeamMembers(result.teamMembers)
          setSubscription(result.subscription)
        }
      } catch (err) {
        console.error('Error loading settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) {
      loadSettings()
    }
  }, [session?.user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await updateOrganizationSettings({
        name: formData.organizationName,
        phone: formData.phone,
        website: formData.website,
        country: formData.country,
      })

      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveTeamMember = async (id: string) => {
    setSaving(true)
    try {
      // TODO: Implement remove team member API call
      setTeamMembers((prev) => prev.filter((member) => member.id !== id))
    } catch (error) {
      console.error('Failed to remove team member:', error)
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/20 text-purple-300'
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300'
      default:
        return 'bg-slate-500/20 text-slate-300'
    }
  }

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'TRIALING':
        return 'text-emerald-400'
      case 'PAST_DUE':
        return 'text-orange-400'
      case 'EXPIRED':
      case 'CANCELLED':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Organization Information */}
      <SettingsCard>
        <FormSection
          title="Organization Information"
          description="Update your organization details"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {saved && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Settings saved successfully
              </div>
            )}

            <FormInput
              id="organizationName"
              name="organizationName"
              type="text"
              label="Organization Name"
              value={formData.organizationName}
              onChange={handleChange}
            />

            <FormInput
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              disabled
            />

            <FormInput
              id="phone"
              name="phone"
              type="tel"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
            />

            <FormInput
              id="website"
              name="website"
              type="url"
              label="Website"
              value={formData.website}
              onChange={handleChange}
            />

            <FormInput
              id="country"
              name="country"
              type="text"
              label="Country"
              value={formData.country}
              onChange={handleChange}
            />

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-slate-300 mb-2">
                Timezone
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
              >
                <option value="Africa/Accra" className="bg-slate-900 text-white">Africa/Accra (GMT)</option>
                <option value="Africa/Lagos" className="bg-slate-900 text-white">Africa/Lagos (WAT)</option>
                <option value="Africa/Johannesburg" className="bg-slate-900 text-white">Africa/Johannesburg (SAST)</option>
                <option value="Africa/Cairo" className="bg-slate-900 text-white">Africa/Cairo (EET)</option>
                <option value="Europe/London" className="bg-slate-900 text-white">Europe/London (GMT/BST)</option>
                <option value="America/New_York" className="bg-slate-900 text-white">America/New_York (EST/EDT)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </FormSection>
      </SettingsCard>

      {/* Team Members */}
      <SettingsCard>
        <FormSection
          title="Team Members"
          description="Manage your organization team"
        >
          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-white">{member.name}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{member.email}</span>
                      <span>•</span>
                      <span>Joined {new Date(member.joinedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveTeamMember(member.id)}
                      disabled={saving}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-400 py-4">No team members yet</p>
            )}
          </div>

          <button className="mt-6 flex items-center gap-2 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-500/30 text-indigo-200 px-4 py-2 rounded-lg font-semibold transition-all duration-300 w-full justify-center">
            <Users className="w-4 h-4" />
            Invite Team Member
          </button>
        </FormSection>
      </SettingsCard>

      {/* Subscription Info */}
      {subscription && (
        <SettingsCard>
          <FormSection title="Current Subscription">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Plan</p>
                <p className="text-lg font-semibold text-white">{subscription.planName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    subscription.status === 'ACTIVE' || subscription.status === 'TRIALING'
                      ? 'bg-emerald-400'
                      : 'bg-orange-400'
                  }`} />
                  <p className={`text-lg font-semibold ${getSubscriptionStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Price</p>
                <p className="text-lg font-semibold text-white">GH₵ {subscription.planPrice}/month</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Billing Cycle</p>
                <p className="text-lg font-semibold text-white">Monthly</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <a
                href="/upgrade"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600/40 to-purple-600/40 hover:from-indigo-600/60 hover:to-purple-600/60 border border-indigo-500/30 text-indigo-200 rounded-lg text-sm font-semibold transition-all duration-300 text-center"
              >
                Upgrade Plan
              </a>
              <a
                href="/settings/billing"
                className="px-4 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 hover:from-blue-600/60 hover:to-cyan-600/60 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 rounded-lg text-sm font-semibold transition-all duration-300 text-center"
              >
                Manage Billing
              </a>
            </div>
          </FormSection>
        </SettingsCard>
      )}

      {/* Danger Zone */}
      <SettingsCard>
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-300">Danger Zone</h3>
            <p className="text-sm text-red-400 mt-1">Irreversible actions</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Organization
        </button>
      </SettingsCard>

      {/* Delete Organization Modal */}
      <DeleteOrganizationModal
        isOpen={showDeleteModal}
        organizationName={formData.organizationName}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => {
          // Redirect to login (signOut handles this)
          window.location.href = '/auth/login'
        }}
      />
    </div>
  )
}
