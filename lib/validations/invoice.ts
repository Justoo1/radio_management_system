/**
 * Invoice Validation Schemas
 * Zod schemas for invoice creation, updates, and line items
 */

import { z } from 'zod'

// Invoice Item Schema (for line items in an invoice)
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val > 0, 'Unit price must be greater than 0'),
  amount: z.number().optional(), // Auto-calculated on server
})

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>

// Create Invoice Schema
export const createInvoiceSchema = z.object({
  clientId: z.string().cuid('Invalid client ID'),
  contractId: z.string().cuid('Invalid contract ID').optional().nullable(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  subtotal: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Subtotal cannot be negative'),
  taxAmount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Tax amount cannot be negative')
    .optional()
    .nullable(),
  discount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Discount cannot be negative')
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})
  .refine((data) => data.dueDate >= data.issueDate, {
    message: 'Due date must be after issue date',
    path: ['dueDate'],
  })

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

// Update Invoice Schema (includes status field)
export const updateInvoiceSchema = z.object({
  clientId: z.string().cuid('Invalid client ID').optional(),
  contractId: z.string().cuid('Invalid contract ID').optional().nullable(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  subtotal: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Subtotal cannot be negative')
    .optional(),
  taxAmount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Tax amount cannot be negative')
    .optional()
    .nullable(),
  discount: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val >= 0, 'Discount cannot be negative')
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(invoiceItemSchema).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
})
  .refine(
    (data) => {
      if (data.issueDate && data.dueDate) {
        return data.dueDate >= data.issueDate
      }
      return true
    },
    {
      message: 'Due date must be after issue date',
      path: ['dueDate'],
    }
  )

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>

// List Invoices Query Schema
export const listInvoicesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'])
    .optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
})

export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>

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
