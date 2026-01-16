/**
 * Centralized Limit Enforcement Service
 * Checks organization resource limits based on subscription plan
 */

import { prisma } from '@/lib/prisma'

export interface LimitCheckResult {
  allowed: boolean
  current: number
  max: number
  message?: string
}

/**
 * Check if organization can create more users
 */
export async function checkUserLimit(organizationId: string): Promise<LimitCheckResult> {
  const [userCount, organization] = await Promise.all([
    prisma.user.count({
      where: { organizationId },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxUsers: true },
    }),
  ])

  if (!organization) {
    throw new Error('Organization not found')
  }

  const allowed = userCount < organization.maxUsers

  return {
    allowed,
    current: userCount,
    max: organization.maxUsers,
    message: allowed
      ? undefined
      : `User limit reached. Your plan allows a maximum of ${organization.maxUsers} users. Please upgrade to add more users.`,
  }
}

/**
 * Check if organization can create more clients
 */
export async function checkClientLimit(organizationId: string): Promise<LimitCheckResult> {
  const [clientCount, organization] = await Promise.all([
    prisma.client.count({
      where: { organizationId },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxClients: true },
    }),
  ])

  if (!organization) {
    throw new Error('Organization not found')
  }

  const allowed = clientCount < organization.maxClients

  return {
    allowed,
    current: clientCount,
    max: organization.maxClients,
    message: allowed
      ? undefined
      : `Client limit reached. Your plan allows a maximum of ${organization.maxClients} clients. Please upgrade to add more clients.`,
  }
}

/**
 * Check if organization has enough storage for upload
 */
export async function checkStorageLimit(
  organizationId: string,
  additionalBytes: number = 0
): Promise<LimitCheckResult> {
  const [storageUsage, organization] = await Promise.all([
    prisma.mediaFile.aggregate({
      where: { organizationId },
      _sum: { size: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxStorageGB: true },
    }),
  ])

  if (!organization) {
    throw new Error('Organization not found')
  }

  const totalUsedBytes = (storageUsage._sum?.size || 0) + additionalBytes
  const maxStorageBytes = organization.maxStorageGB * 1024 * 1024 * 1024

  const allowed = totalUsedBytes < maxStorageBytes

  const usedGB = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2)

  return {
    allowed,
    current: totalUsedBytes,
    max: maxStorageBytes,
    message: allowed
      ? undefined
      : `Storage limit reached (${usedGB}GB / ${organization.maxStorageGB}GB). Please upgrade your plan for more storage.`,
  }
}

/**
 * Check if organization can create more programs
 */
export async function checkProgramLimit(organizationId: string): Promise<LimitCheckResult> {
  const [programCount, organization] = await Promise.all([
    prisma.program.count({
      where: { organizationId },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxPrograms: true },
    }),
  ])

  if (!organization) {
    throw new Error('Organization not found')
  }

  const allowed = programCount < organization.maxPrograms

  return {
    allowed,
    current: programCount,
    max: organization.maxPrograms,
    message: allowed
      ? undefined
      : `Program limit reached. Your plan allows a maximum of ${organization.maxPrograms} programs. Please upgrade to add more programs.`,
  }
}

/**
 * Check if organization has sufficient SMS credits
 */
export async function checkSMSLimit(
  organizationId: string,
  required: number
): Promise<LimitCheckResult> {
  const credits = await prisma.sMSCredit.findUnique({
    where: { organizationId },
  })

  if (!credits) {
    return {
      allowed: false,
      current: 0,
      max: 0,
      message: 'No SMS credits available. Please purchase credits or upgrade your plan.',
    }
  }

  // Available = current balance + (monthly allocation - monthly used)
  const monthlyAllocation = (credits as any).monthlyAllocation || 0
  const monthlyUsed = (credits as any).monthlyUsed || 0
  const monthlyRemaining = Math.max(0, monthlyAllocation - monthlyUsed)
  const available = credits.balance + monthlyRemaining

  const allowed = available >= required

  return {
    allowed,
    current: available,
    max: available + required,
    message: allowed
      ? undefined
      : `Insufficient SMS credits. Required: ${required}, Available: ${available}. Please purchase more credits or upgrade your plan.`,
  }
}

/**
 * Get all limits for an organization (for display purposes)
 */
export async function getAllLimits(organizationId: string) {
  const [
    userCount,
    clientCount,
    programCount,
    storageUsage,
    streamingConfig,
    smsCredits,
    organization,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId } }),
    prisma.program.count({ where: { organizationId } }),
    prisma.mediaFile.aggregate({
      where: { organizationId },
      _sum: { size: true },
    }),
    prisma.streamingConfig.findUnique({
      where: { organizationId },
      select: { storageUsedMB: true },
    }),
    prisma.sMSCredit.findUnique({ where: { organizationId } }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        maxUsers: true,
        maxClients: true,
        maxSMSPerMonth: true,
        maxStorageGB: true,
        maxPrograms: true,
        status: true,
      },
    }),
  ])

  if (!organization) {
    throw new Error('Organization not found')
  }

  const mediaStorageBytes = storageUsage._sum?.size || 0
  const streamingStorageBytes = (streamingConfig?.storageUsedMB || 0) * 1024 * 1024
  const totalUsedBytes = mediaStorageBytes + streamingStorageBytes
  const usedGB = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2)

  const monthlyAllocation = (smsCredits as any)?.monthlyAllocation || 0
  const monthlyUsed = (smsCredits as any)?.monthlyUsed || 0
  const smsBalance = smsCredits?.balance || 0
  const monthlyRemaining = Math.max(0, monthlyAllocation - monthlyUsed)
  const totalSMSAvailable = smsBalance + monthlyRemaining

  return {
    users: {
      current: userCount,
      max: organization.maxUsers,
      percentage: (userCount / organization.maxUsers) * 100,
    },
    clients: {
      current: clientCount,
      max: organization.maxClients,
      percentage: (clientCount / organization.maxClients) * 100,
    },
    programs: {
      current: programCount,
      max: organization.maxPrograms,
      percentage: (programCount / organization.maxPrograms) * 100,
    },
    storage: {
      current: usedGB,
      max: organization.maxStorageGB,
      percentage: (parseFloat(usedGB) / organization.maxStorageGB) * 100,
      unit: 'GB',
    },
    sms: {
      current: totalSMSAvailable,
      monthlyAllocation,
      monthlyUsed,
      monthlyRemaining,
      purchasedBalance: smsBalance,
      max: organization.maxSMSPerMonth,
      percentage: monthlyAllocation > 0 ? (monthlyUsed / monthlyAllocation) * 100 : 0,
    },
  }
}
