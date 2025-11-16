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
      members: true,
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
    description?: string
    logo?: string
    website?: string
    country?: string
    timezone?: string
  }
) {
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...data,
    },
    include: {
      members: true,
    },
  })

  return org
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return members
}

/**
 * Add a member to organization (invite)
 */
export async function addOrganizationMember(
  organizationId: string,
  email: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
) {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new Error('User not found. Please invite them to create an account first.')
  }

  // Check if already a member
  const existingMember = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  })

  if (existingMember) {
    throw new Error('User is already a member of this organization')
  }

  const member = await prisma.organizationMember.create({
    data: {
      organizationId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return member
}

/**
 * Remove a member from organization
 */
export async function removeOrganizationMember(
  organizationId: string,
  userId: string
) {
  // Prevent removing the owner
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (org?.ownerId === userId) {
    throw new Error('Cannot remove the organization owner')
  }

  await prisma.organizationMember.delete({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
  })

  return { success: true }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  organizationId: string,
  userId: string,
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
) {
  const member = await prisma.organizationMember.update({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    data: {
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return member
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
    maxClients: (org as any).maxClients || 50,
    maxPrograms: (org as any).maxPrograms || 10,
    maxSMSCampaigns: (org as any).maxSMSCampaigns || 25,
    maxSMSTemplates: (org as any).maxSMSTemplates || 20,
  }

  return {
    organizationId,
    plan,
    subscription: org.subscription || 'FREE',
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
    if (count >= (org as any).maxSMSCampaigns) {
      return {
        allowed: false,
        reason: `SMS campaign limit (${(org as any).maxSMSCampaigns}) reached`,
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
    maxClients: (org as any).maxClients || 50,
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
