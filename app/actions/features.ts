'use server'

/**
 * Feature Access Management Server Actions
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Feature, isFeatureEnabled, parseEnabledFeatures, FEATURES } from '@/lib/features'

/**
 * Check if current user's organization has access to a feature
 */
export async function checkFeatureAccess(feature: Feature): Promise<{
  hasAccess: boolean
  isLocked: boolean
  featureName: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return {
        hasAccess: false,
        isLocked: true,
        featureName: FEATURES[feature].name,
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          select: {
            enabledFeatures: true,
            status: true,
          },
        },
      },
    })

    if (!user?.organization) {
      return {
        hasAccess: false,
        isLocked: true,
        featureName: FEATURES[feature].name,
      }
    }

    // Check if organization is active
    if (user.organization.status === 'SUSPENDED' || user.organization.status === 'CANCELLED') {
      return {
        hasAccess: false,
        isLocked: true,
        featureName: FEATURES[feature].name,
      }
    }

    const enabledFeatures = parseEnabledFeatures(user.organization.enabledFeatures)
    const hasAccess = isFeatureEnabled(enabledFeatures, feature)

    return {
      hasAccess,
      isLocked: !hasAccess,
      featureName: FEATURES[feature].name,
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return {
      hasAccess: false,
      isLocked: true,
      featureName: FEATURES[feature].name,
    }
  }
}

/**
 * Get all enabled features for current user's organization
 */
export async function getEnabledFeatures(): Promise<string[]> {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return []
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: {
          select: {
            enabledFeatures: true,
          },
        },
      },
    })

    if (!user?.organization) {
      return []
    }

    return parseEnabledFeatures(user.organization.enabledFeatures)
  } catch (error) {
    console.error('Error getting enabled features:', error)
    return []
  }
}
