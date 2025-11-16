/**
 * Client Validation Schemas
 * Zod schemas for client management forms
 */

import { z } from 'zod'

// Create/Update Client Schema
export const clientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().optional(),
  taxId: z.string().optional(),
  registrationNo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
})

export type ClientInput = z.infer<typeof clientSchema>

// Contact Person Schema
export const contactPersonSchema = z.object({
  name: z
    .string()
    .min(1, 'Contact name is required')
    .min(2, 'Contact name must be at least 2 characters'),
  position: z.string().optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
})

export type ContactPersonInput = z.infer<typeof contactPersonSchema>

// Client Filter Schema
export const clientFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  pageSize: z.number().min(1).max(100).optional(),
})

export type ClientFilterInput = z.infer<typeof clientFilterSchema>
