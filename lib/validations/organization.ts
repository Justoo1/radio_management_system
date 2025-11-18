/**
 * Organization Validation Schemas
 * Zod schemas for organization operations
 */

import { z } from 'zod'

// Delete Organization Schema
export const deleteOrganizationSchema = z.object({
  organizationNameConfirmation: z
    .string()
    .min(1, 'Organization name confirmation is required')
    .min(2, 'Organization name must be at least 2 characters'),
  agreeToDelete: z
    .boolean()
    .refine((val) => val === true, 'You must agree that this action is irreversible'),
  agreeToDataLoss: z
    .boolean()
    .refine((val) => val === true, 'You must acknowledge that all data will be permanently deleted'),
})

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>

// Update Organization Info Schema
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must not exceed 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country must not exceed 50 characters'),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
