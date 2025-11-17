/**
 * Payment Validation Schemas
 * Zod schemas for payment recording and tracking
 */

import { z } from 'zod'

// Record Payment Schema
export const recordPaymentSchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID'),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val > 0, 'Payment amount must be greater than 0'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum([
    'CASH',
    'BANK_TRANSFER',
    'MOBILE_MONEY',
    'CHEQUE',
    'CARD',
    'OTHER',
  ]),
  referenceNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>

// List Payments Query Schema
export const listPaymentsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  invoiceId: z.string().cuid('Invalid invoice ID').optional(),
  paymentMethod: z
    .enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'CARD', 'OTHER'])
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
})

export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>
