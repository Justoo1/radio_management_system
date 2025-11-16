/**
 * SMS Validation Schemas
 * Zod schemas for SMS campaign management
 */

import { z } from 'zod'

// SMS Campaign Schema
export const smsCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .min(2, 'Campaign name must be at least 2 characters')
    .max(100, 'Campaign name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  messageContent: z
    .string()
    .min(1, 'Message content is required')
    .max(160, 'Message must be 160 characters or less (SMS limit)'),
  templateId: z.string().optional(),
  recipientType: z.enum(['ALL', 'CATEGORY', 'CUSTOM', 'IMPORTED']),
  recipientFilter: z.record(z.string(), z.any()).optional(),
  scheduledAt: z
    .string()
    .datetime('Please enter a valid date and time')
    .optional(),
  sendImmediately: z.boolean().optional(),
})

export type SMSCampaignInput = z.infer<typeof smsCampaignSchema>

// SMS Template Schema
export const smsTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .min(2, 'Template name must be at least 2 characters')
    .max(100, 'Template name must be less than 100 characters'),
  content: z
    .string()
    .min(1, 'Template content is required')
    .max(160, 'Message must be 160 characters or less (SMS limit)'),
  category: z.string().optional(),
  variables: z.array(z.string()).optional(),
})

export type SMSTemplateInput = z.infer<typeof smsTemplateSchema>

// SMS Campaign Filter Schema
export const smsCampaignFilterSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      'DRAFT',
      'SCHEDULED',
      'PROCESSING',
      'SENT',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ])
    .optional(),
  sortBy: z.enum(['name', 'createdAt', 'scheduledAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
})

export type SMSCampaignFilterInput = z.infer<typeof smsCampaignFilterSchema>

// Send Campaign Schema
export const sendCampaignSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID is required'),
})

export type SendCampaignInput = z.infer<typeof sendCampaignSchema>
