/**
 * Organization Service
 * Business logic for organization management
 */

import { prisma } from '@/lib/prisma'

/**
 * Get organization details
 */
export async function getOrganization(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: true,
      owner: true,
    },
  })

  return org
}

/**
 * Update organization settings
 */
export async function updateOrganization(
  organizationId: string,
  data: {
    name?: string
    logo?: string
    website?: string
    country?: string
    phone?: string
  }
) {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...data,
    },
    include: {
      users: true,
      owner: true,
    },
  })

  return org
}

/**
 * Get organization users/members
 */
export async function getOrganizationUsers(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return org?.users || []
}

/**
 * Get organization subscription and plan
 */
export async function getOrganizationPlan(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    return null
  }

  const plan = {
    maxClients: (org as any).maxClients || 100,
    maxPrograms: (org as any).maxPrograms || 10,
    maxSMSPerMonth: (org as any).maxSMSPerMonth || 500,
    maxUsers: (org as any).maxUsers || 5,
  }

  return {
    organizationId,
    plan,
    subscriptionId: org.subscriptionId || null,
    status: (org as any).status || 'TRIAL',
  }
}

/**
 * Check if organization can perform action
 */
export async function canPerformAction(
  organizationId: string,
  action: 'createClient' | 'createProgram' | 'createSMSCampaign'
): Promise<{ allowed: boolean; reason?: string }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    return { allowed: false, reason: 'Organization not found' }
  }

  if (action === 'createClient') {
    const count = await prisma.client.count({
      where: { organizationId },
    })
    if (count >= (org as any).maxClients) {
      return {
        allowed: false,
        reason: `Client limit (${(org as any).maxClients}) reached`,
      }
    }
  } else if (action === 'createProgram') {
    const count = await prisma.program.count({
      where: { organizationId },
    })
    if (count >= (org as any).maxPrograms) {
      return {
        allowed: false,
        reason: `Program limit (${(org as any).maxPrograms}) reached`,
      }
    }
  } else if (action === 'createSMSCampaign') {
    const count = await prisma.sMSCampaign.count({
      where: { organizationId },
    })
    // Assuming maxSMSCampaigns is 25 as default
    const limit = (org as any).maxSMSCampaigns || 25
    if (count >= limit) {
      return {
        allowed: false,
        reason: `SMS campaign limit (${limit}) reached`,
      }
    }
  }

  return { allowed: true }
}

/**
 * Get organization dashboard statistics
 */
export async function getDashboardStats(organizationId: string) {
  const [
    totalClients,
    activeClients,
    totalPrograms,
    activePrograms,
    totalCampaigns,
    sentCampaigns,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.client.count({
      where: { organizationId, status: 'ACTIVE' },
    }),
    prisma.program.count({ where: { organizationId } }),
    prisma.program.count({
      where: { organizationId, isActive: true },
    }),
    prisma.sMSCampaign.count({ where: { organizationId } }),
    prisma.sMSCampaign.count({
      where: { organizationId, status: 'SENT' },
    }),
  ])

  return {
    clients: {
      total: totalClients,
      active: activeClients,
    },
    programs: {
      total: totalPrograms,
      active: activePrograms,
    },
    campaigns: {
      total: totalCampaigns,
      sent: sentCampaigns,
    },
  }
}

/**
 * Calculate organization usage and limits
 */
export async function getOrganizationUsage(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    return null
  }

  const [clientCount, programCount, campaignCount] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.program.count({ where: { organizationId } }),
    prisma.sMSCampaign.count({ where: { organizationId } }),
  ])

  const limits = {
    maxClients: (org as any).maxClients || 100,
    maxPrograms: (org as any).maxPrograms || 10,
    maxSMSCampaigns: (org as any).maxSMSCampaigns || 25,
  }

  return {
    clients: {
      used: clientCount,
      limit: limits.maxClients,
      percentage: (clientCount / limits.maxClients) * 100,
    },
    programs: {
      used: programCount,
      limit: limits.maxPrograms,
      percentage: (programCount / limits.maxPrograms) * 100,
    },
    campaigns: {
      used: campaignCount,
      limit: limits.maxSMSCampaigns,
      percentage: (campaignCount / limits.maxSMSCampaigns) * 100,
    },
  }
}

/**
 * Get organization owner
 */
export async function getOrganizationOwner(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      owner: true,
    },
  })

  return org?.owner || null
}

/**
 * Check if user is organization owner
 */
export async function isOrganizationOwner(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  return org?.ownerId === userId
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      users: true,
      owner: true,
    },
  })

  return org
}
