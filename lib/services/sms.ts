/**
 * SMS Service
 * Business logic for SMS campaign and template management
 */

import { prisma } from '@/lib/prisma'
import {
  SMSCampaignInput,
  SMSTemplateInput,
  SMSCampaignFilterInput,
} from '@/lib/validations/sms'

/**
 * Get all SMS campaigns for an organization
 */
export async function getSMSCampaigns(
  organizationId: string,
  filters?: SMSCampaignFilterInput
) {
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 10
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = {
    organizationId,
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters?.status) {
    where.status = filters.status
  }

  // Build order by
  const orderBy: any = {}
  if (filters?.sortBy === 'name') {
    orderBy.name = filters.sortOrder || 'asc'
  } else if (filters?.sortBy === 'scheduledAt') {
    orderBy.scheduledAt = filters.sortOrder || 'asc'
  } else {
    orderBy.createdAt = filters?.sortOrder || 'desc'
  }

  const [campaigns, total] = await Promise.all([
    prisma.sMSCampaign.findMany({
      where,
      skip,
      take: pageSize,
      orderBy,
      include: {
        template: true,
      },
    }),
    prisma.sMSCampaign.count({ where }),
  ])

  return {
    data: campaigns,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page < Math.ceil(total / pageSize),
      hasPrev: page > 1,
    },
  }
}

/**
 * Get a single SMS campaign by ID
 */
export async function getSMSCampaignById(
  campaignId: string,
  organizationId: string
) {
  const campaign = await prisma.sMSCampaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
    },
  })

  if (!campaign || campaign.organizationId !== organizationId) {
    return null
  }

  return campaign
}

/**
 * Create a new SMS campaign
 */
export async function createSMSCampaign(
  organizationId: string,
  data: SMSCampaignInput
) {
  // Check organization exists and get feature limit
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  // Check campaign limit
  const campaignCount = await prisma.sMSCampaign.count({
    where: { organizationId },
  })

  if (campaignCount >= (org as any).maxSMSCampaigns) {
    throw new Error(
      `SMS campaign limit (${(org as any).maxSMSCampaigns}) reached for your organization`
    )
  }

  // If using a template, verify it exists
  if (data.templateId) {
    const template = await prisma.sMSTemplate.findUnique({
      where: { id: data.templateId },
    })

    if (!template || template.organizationId !== organizationId) {
      throw new Error('Template not found')
    }
  }

  const campaign = await prisma.sMSCampaign.create({
    data: {
      ...data,
      organizationId,
      status: 'DRAFT',
      recipientFilter: data.recipientFilter
        ? JSON.stringify(data.recipientFilter)
        : null,
    } as any,
    include: {
      template: true,
    },
  })

  return campaign
}

/**
 * Update an SMS campaign
 */
export async function updateSMSCampaign(
  campaignId: string,
  organizationId: string,
  data: Partial<SMSCampaignInput>
) {
  const campaign = await getSMSCampaignById(campaignId, organizationId)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Prevent updating sent campaigns
  if (campaign.status === 'SENT') {
    throw new Error('Cannot update a sent campaign')
  }

  // Verify template if provided
  if (data.templateId) {
    const template = await prisma.sMSTemplate.findUnique({
      where: { id: data.templateId },
    })

    if (!template || template.organizationId !== organizationId) {
      throw new Error('Template not found')
    }
  }

  const updated = await prisma.sMSCampaign.update({
    where: { id: campaignId },
    data: {
      ...data,
      recipientFilter: data.recipientFilter
        ? JSON.stringify(data.recipientFilter)
        : undefined,
    } as any,
    include: {
      template: true,
    },
  })

  return updated
}

/**
 * Delete an SMS campaign
 */
export async function deleteSMSCampaign(
  campaignId: string,
  organizationId: string
) {
  const campaign = await getSMSCampaignById(campaignId, organizationId)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Prevent deleting sent campaigns
  if (campaign.status === 'SENT') {
    throw new Error('Cannot delete a sent campaign')
  }

  await prisma.sMSCampaign.delete({
    where: { id: campaignId },
  })

  return { success: true }
}

/**
 * Send an SMS campaign
 */
export async function sendSMSCampaign(
  campaignId: string,
  organizationId: string
) {
  const campaign = await getSMSCampaignById(campaignId, organizationId)
  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new Error(
      `Cannot send a campaign with status: ${campaign.status}`
    )
  }

  // Get recipient count based on filter type
  let recipientCount = 0
  if (campaign.recipientType === 'ALL') {
    recipientCount = await prisma.client.count({
      where: { organizationId },
    })
  } else if (campaign.recipientType === 'CATEGORY' && campaign.recipientFilter) {
    const filter = JSON.parse(campaign.recipientFilter as string)
    recipientCount = await prisma.client.count({
      where: {
        organizationId,
        categoryId: filter.categoryId,
      },
    })
  } else if (campaign.recipientType === 'CUSTOM' && campaign.recipientFilter) {
    const filter = JSON.parse(campaign.recipientFilter as string)
    recipientCount = (filter.phoneNumbers as string[])?.length || 0
  }

  if (recipientCount === 0) {
    throw new Error('No recipients found for this campaign')
  }

  // Update campaign status
  const updated = await prisma.sMSCampaign.update({
    where: { id: campaignId },
    data: {
      status: campaign.sendImmediately ? 'PROCESSING' : 'SCHEDULED',
      recipientCount,
      sentAt: campaign.sendImmediately ? new Date() : null,
    },
    include: {
      template: true,
    },
  })

  // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
  // This is where you would queue the SMS sending job

  return updated
}

/**
 * Get all SMS templates for an organization
 */
export async function getSMSTemplates(
  organizationId: string,
  search?: string
) {
  const where: any = { organizationId }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ]
  }

  const templates = await prisma.sMSTemplate.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return templates
}

/**
 * Get a single SMS template by ID
 */
export async function getSMSTemplateById(
  templateId: string,
  organizationId: string
) {
  const template = await prisma.sMSTemplate.findUnique({
    where: { id: templateId },
  })

  if (!template || template.organizationId !== organizationId) {
    return null
  }

  return template
}

/**
 * Create a new SMS template
 */
export async function createSMSTemplate(
  organizationId: string,
  data: SMSTemplateInput
) {
  // Check organization exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  if (!org) {
    throw new Error('Organization not found')
  }

  const template = await prisma.sMSTemplate.create({
    data: {
      ...data,
      organizationId,
      variables: data.variables ? JSON.stringify(data.variables) : null,
    } as any,
  })

  return template
}

/**
 * Update an SMS template
 */
export async function updateSMSTemplate(
  templateId: string,
  organizationId: string,
  data: Partial<SMSTemplateInput>
) {
  const template = await getSMSTemplateById(templateId, organizationId)
  if (!template) {
    throw new Error('Template not found')
  }

  const updated = await prisma.sMSTemplate.update({
    where: { id: templateId },
    data: {
      ...data,
      variables: data.variables ? JSON.stringify(data.variables) : undefined,
    } as any,
  })

  return updated
}

/**
 * Delete an SMS template
 */
export async function deleteSMSTemplate(
  templateId: string,
  organizationId: string
) {
  const template = await getSMSTemplateById(templateId, organizationId)
  if (!template) {
    throw new Error('Template not found')
  }

  // Check if template is in use
  const campaignCount = await prisma.sMSCampaign.count({
    where: { templateId },
  })

  if (campaignCount > 0) {
    throw new Error(
      'Cannot delete a template that is being used by campaigns'
    )
  }

  await prisma.sMSTemplate.delete({
    where: { id: templateId },
  })

  return { success: true }
}

/**
 * Get SMS campaign statistics
 */
export async function getSMSStats(organizationId: string) {
  const [total, draft, scheduled, sent, failed] = await Promise.all([
    prisma.sMSCampaign.count({ where: { organizationId } }),
    prisma.sMSCampaign.count({
      where: { organizationId, status: 'DRAFT' },
    }),
    prisma.sMSCampaign.count({
      where: { organizationId, status: 'SCHEDULED' },
    }),
    prisma.sMSCampaign.count({
      where: { organizationId, status: 'SENT' },
    }),
    prisma.sMSCampaign.count({
      where: { organizationId, status: 'FAILED' },
    }),
  ])

  return {
    total,
    draft,
    scheduled,
    sent,
    failed,
  }
}

/**
 * Replace variables in SMS content with actual values
 */
export function replaceVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
  })
  return result
}

/**
 * Validate SMS content length
 */
export function validateSMSLength(content: string): {
  valid: boolean
  length: number
  segments: number
} {
  const length = content.length
  // SMS standard is 160 characters per segment
  // For multi-byte characters (like emojis), it's 70 characters
  const hasMultibyte = /[^\x00-\x7F]/.test(content)
  const segmentLength = hasMultibyte ? 67 : 160
  const segments = Math.ceil(length / segmentLength)

  return {
    valid: length <= 160 * 3, // Allow up to 3 segments (480 chars)
    length,
    segments,
  }
}
