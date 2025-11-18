'use server'

/**
 * Settings Server Actions
 * Handles fetching and updating organization settings
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export interface OrganizationSettings {
  id: string
  name: string
  email: string
  phone: string | null
  website: string | null
  country: string
  status: string
  createdAt: Date
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  joinedDate: Date
}

export interface SubscriptionInfo {
  planName: string
  planPrice: string
  status: string
  currentPeriodEnd: Date | null
  renewalDate: Date | null
}

/**
 * Get organization settings and team information
 */
export async function getOrganizationSettings() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      throw new Error('Unauthorized')
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        organization: true,
      },
    })

    if (!user || !user.organization) {
      throw new Error('Organization not found')
    }

    const organization = user.organization

    // Get team members with their roles
    const teamMembers = await prisma.user.findMany({
      where: { organizationId: organization.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
        createdAt: true,
      },
    })

    // Get subscription info
    let subscriptionInfo: SubscriptionInfo | null = null
    if (organization.subscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: organization.subscriptionId },
        include: { plan: true },
      })

      if (subscription) {
        subscriptionInfo = {
          planName: subscription.plan.name,
          planPrice: subscription.plan.price.toString(),
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          renewalDate: subscription.nextPaymentDate,
        }
      }
    }

    return {
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        country: organization.country,
        status: organization.status,
        createdAt: organization.createdAt,
      } as OrganizationSettings,
      teamMembers: teamMembers.map((member) => ({
        id: member.id,
        name: member.name || 'Unknown',
        email: member.email,
        role: member.role.name,
        joinedDate: member.createdAt,
      })) as TeamMember[],
      subscription: subscriptionInfo,
    }
  } catch (error) {
    console.error('Error fetching organization settings:', error)
    throw error
  }
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(data: {
  name: string
  phone?: string
  website?: string
  country?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      throw new Error('Unauthorized')
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        organizationId: true,
        organization: true,
      },
    })

    if (!user || !user.organization) {
      throw new Error('Organization not found')
    }

    // Verify user is owner by checking if they own the organization
    const userAsOwner = await prisma.organization.findFirst({
      where: {
        id: user.organizationId,
        ownerId: user.id,
      },
    })

    if (!userAsOwner) {
      throw new Error('Only organization owners can update settings')
    }

    // Update organization
    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name: data.name,
        phone: data.phone || undefined,
        website: data.website || undefined,
        country: data.country || undefined,
      },
    })

    return {
      success: true,
      message: 'Settings updated successfully',
      organization: updated,
    }
  } catch (error) {
    console.error('Error updating organization settings:', error)
    throw error
  }
}
