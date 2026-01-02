/**
 * Feature Guard Component
 * Wraps page content and shows locked screen if feature is disabled
 */

'use client'

import { useEffect, useState } from 'react'
import { Feature } from '@/lib/features'
import { checkFeatureAccess } from '@/app/actions/features'
import { FeatureLocked } from './feature-locked'

interface FeatureGuardProps {
  feature: Feature
  children: React.ReactNode
  featureDescription?: string
}

export function FeatureGuard({ feature, children, featureDescription }: FeatureGuardProps) {
  const [access, setAccess] = useState<{
    hasAccess: boolean
    isLocked: boolean
    featureName: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      try {
        const result = await checkFeatureAccess(feature)
        setAccess(result)
      } catch (error) {
        console.error('Error checking feature access:', error)
        setAccess({
          hasAccess: false,
          isLocked: true,
          featureName: 'This Feature',
        })
      } finally {
        setLoading(false)
      }
    }
    checkAccess()
  }, [feature])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!access?.hasAccess && access?.isLocked) {
    return <FeatureLocked featureName={access.featureName} featureDescription={featureDescription} />
  }

  return <>{children}</>
}
