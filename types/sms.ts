/**
 * SMS Types
 */

export type RecipientType = 'ALL' | 'CATEGORY' | 'CUSTOM' | 'IMPORTED'
export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
export type MessageStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'REJECTED'

export interface SMSCampaignDTO {
  name: string
  description?: string
  templateId?: string
  messageContent: string
  recipientType: RecipientType
  recipientFilter?: Record<string, any>
  scheduledAt?: Date
  sendImmediately?: boolean
}

export interface SMSTemplateDTO {
  name: string
  content: string
  category?: string
  variables?: string[]
}

export interface SMSCampaignResponse {
  id: string
  organizationId: string
  name: string
  description?: string
  messageContent: string
  recipientType: RecipientType
  recipientFilter?: Record<string, any>
  totalRecipients: number
  status: CampaignStatus
  sentCount: number
  deliveredCount: number
  failedCount: number
  estimatedCost?: number
  actualCost?: number
  createdAt: Date
  updatedAt: Date
  sentAt?: Date
  completedAt?: Date
}

export interface SMSMessage {
  id: string
  campaignId?: string
  recipient: string
  recipientName?: string
  message: string
  status: MessageStatus
  sentAt?: Date
  deliveredAt?: Date
  cost?: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface SMSTemplate {
  id: string
  name: string
  content: string
  category?: string
  variables?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface SMSCredit {
  organizationId: string
  balance: number
  totalPurchased: number
  totalUsed: number
  lastPurchaseDate?: Date
  lastPurchaseAmount?: number
  lastPurchaseCost?: number
  updatedAt: Date
}
