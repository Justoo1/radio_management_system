/**
 * Organization Feature Management (Admin Only)
 * Allows admin to enable/disable features for specific organizations
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Lock, Unlock, Save, ArrowLeft, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FEATURES, Feature, getPremiumFeatures, getCoreFeatures } from '@/lib/features'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  email: string
  status: string
  enabledFeatures: string
}

export default function OrganizationFeaturesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrganization()
  }, [orgId])

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)

        // Parse enabled features
        try {
          const features = JSON.parse(data.enabledFeatures || '[]')
          setEnabledFeatures(features)
        } catch {
          setEnabledFeatures([])
        }
      } else {
        toast.error('Failed to load organization')
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
      toast.error('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (featureKey: Feature) => {
    setEnabledFeatures(prev => {
      if (prev.includes(featureKey)) {
        return prev.filter(f => f !== featureKey)
      } else {
        return [...prev, featureKey]
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/features`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledFeatures }),
      })

      if (response.ok) {
        toast.success('Features updated successfully')
      } else {
        toast.error('Failed to update features')
      }
    } catch (error) {
      console.error('Error saving features:', error)
      toast.error('Failed to update features')
    } finally {
      setSaving(false)
    }
  }

  const enableAllPremium = () => {
    const allPremiumKeys = getPremiumFeatures().map(f => f.key)
    setEnabledFeatures(prev => {
      const combined = [...prev, ...allPremiumKeys]
      return [...new Set(combined)]
    })
  }

  const disableAllPremium = () => {
    const premiumKeys = getPremiumFeatures().map(f => f.key)
    setEnabledFeatures(prev => prev.filter(f => !premiumKeys.includes(f as Feature)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400">Organization not found</p>
      </div>
    )
  }

  const coreFeatures = getCoreFeatures()
  const premiumFeatures = getPremiumFeatures()

  return (
    <div className="min-h-screen p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Manage Features
            </h1>
            <p className="text-sm sm:text-base text-slate-400 break-words">
              {organization.name} ({organization.email})
            </p>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                organization.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : organization.status === 'TRIAL'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {organization.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={enableAllPremium}
              variant="outline"
              className="w-full sm:w-auto border-green-500/50 text-green-400 hover:bg-green-500/10 text-sm"
            >
              <Unlock className="w-4 h-4 mr-2" />
              Enable All Premium
            </Button>
            <Button
              onClick={disableAllPremium}
              variant="outline"
              className="w-full sm:w-auto border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm"
            >
              <Lock className="w-4 h-4 mr-2" />
              Disable All Premium
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Core Features (Always Enabled) */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
          Core Features (Always Enabled)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {coreFeatures.map((feature) => (
            <div
              key={feature.key}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white text-sm sm:text-base">{feature.name}</h3>
                <div className="bg-green-500/20 p-2 rounded-lg flex-shrink-0">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Features (Can be Locked) */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
          Premium Features (Admin Controlled)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {premiumFeatures.map((feature) => {
            const isEnabled = enabledFeatures.includes(feature.key)

            return (
              <div
                key={feature.key}
                className={`bg-white/5 backdrop-blur-xl rounded-xl p-4 sm:p-6 border transition-all cursor-pointer ${
                  isEnabled
                    ? 'border-green-500/50 shadow-lg shadow-green-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
                onClick={() => toggleFeature(feature.key)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white text-sm sm:text-base">{feature.name}</h3>
                  <button
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      isEnabled
                        ? 'bg-green-500/20 hover:bg-green-500/30'
                        : 'bg-red-500/20 hover:bg-red-500/30'
                    }`}
                  >
                    {isEnabled ? (
                      <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    ) : (
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-xs sm:text-sm mb-3">{feature.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${
                    isEnabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isEnabled ? 'Enabled' : 'Locked'}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">Click to toggle</span>
                  <span className="text-slate-500 sm:hidden">Tap to toggle</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 sm:mt-8 bg-white/5 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          <div>
            <p className="text-slate-400 text-xs sm:text-sm mb-1">Core Features</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{coreFeatures.length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm mb-1">Premium Enabled</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">
              {enabledFeatures.filter(f => premiumFeatures.some(pf => pf.key === f)).length}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs sm:text-sm mb-1">Premium Locked</p>
            <p className="text-xl sm:text-2xl font-bold text-red-400">
              {premiumFeatures.length - enabledFeatures.filter(f => premiumFeatures.some(pf => pf.key === f)).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
