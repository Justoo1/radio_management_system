/**
 * Billing Validation Schemas
 * Zod schemas for billing, payment, and subscription operations
 */

import { z } from 'zod'

// Payment Method Schema
export const addPaymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(13, 'Card number must be at least 13 digits')
    .max(19, 'Card number must not exceed 19 digits')
    .regex(/^\d+$/, 'Card number must contain only digits'),
  cardName: z
    .string()
    .min(2, 'Cardholder name must be at least 2 characters')
    .max(100, 'Cardholder name must not exceed 100 characters'),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Expiry date must be in MM/YY format'),
  cvc: z
    .string()
    .regex(/^\d{3,4}$/, 'CVC must be 3 or 4 digits'),
})

export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>

// Update Billing Address Schema
export const updateBillingAddressSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must not exceed 200 characters'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must not exceed 50 characters'),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country must not exceed 50 characters'),
  zipCode: z
    .string()
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
})

export type UpdateBillingAddressInput = z.infer<typeof updateBillingAddressSchema>

// Change Plan Schema
export const changePlanSchema = z.object({
  planId: z
    .string()
    .min(1, 'Plan selection is required'),
  billingInterval: z
    .enum(['MONTHLY', 'QUARTERLY', 'YEARLY'])
    .default('MONTHLY'),
})

export type ChangePlanInput = z.infer<typeof changePlanSchema>

// Cancel Subscription Schema
export const cancelSubscriptionSchema = z.object({
  reason: z
    .string()
    .optional(),
  feedback: z
    .string()
    .max(1000, 'Feedback must not exceed 1000 characters')
    .optional(),
  cancelImmediately: z
    .boolean()
    .default(false),
})

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>

// Invoice Filter Schema
export const invoiceFilterSchema = z.object({
  status: z
    .enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
    .optional(),
  startDate: z
    .date()
    .optional(),
  endDate: z
    .date()
    .optional(),
  page: z
    .number()
    .int()
    .positive()
    .default(1),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(10),
})

export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>

// Payment Method Validation
export const validatePaymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .regex(/^\d+$/, 'Card number must contain only digits'),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'Invalid expiry date format'),
  cvc: z
    .string()
    .regex(/^\d{3,4}$/, 'Invalid CVC'),
})

export type ValidatePaymentMethodInput = z.infer<typeof validatePaymentMethodSchema>

// Card Info Schema (for display)
export interface StoredPaymentMethod {
  id: string
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
  createdAt: Date
}
