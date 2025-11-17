/**
 * Contract Validation Schemas
 * Zod schemas for contract creation and updates
 */

import { z } from 'zod'

// Create Contract Schema
export const createContractSchema = z.object({
  contractNumber: z
    .string()
    .min(1, 'Contract number is required')
    .max(50, 'Contract number is too long'),
  clientId: z.string().cuid('Invalid client ID'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  value: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val > 0, 'Contract value must be greater than 0'),
  terms: z.string().max(2000).optional().nullable(),
  documentUrl: z.string().url('Invalid document URL').optional().nullable(),
})
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type CreateContractInput = z.infer<typeof createContractSchema>

// Update Contract Schema (includes status and signature fields)
export const updateContractSchema = z.object({
  contractNumber: z
    .string()
    .min(1, 'Contract number is required')
    .max(50, 'Contract number is too long')
    .optional(),
  clientId: z.string().cuid('Invalid client ID').optional(),
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  value: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => val > 0, 'Contract value must be greater than 0')
    .optional(),
  terms: z.string().max(2000).optional().nullable(),
  documentUrl: z.string().url('Invalid document URL').optional().nullable(),
  status: z
    .enum(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'])
    .optional(),
  signedDocumentUrl: z
    .string()
    .url('Invalid signed document URL')
    .optional()
    .nullable(),
  signedAt: z.coerce.date().optional().nullable(),
})
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

export type UpdateContractInput = z.infer<typeof updateContractSchema>

// List Contracts Query Schema
export const listContractsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z
    .enum(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'])
    .optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type ListContractsInput = z.infer<typeof listContractsSchema>
