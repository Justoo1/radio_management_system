/**
 * Account Validation Schemas
 * Zod schemas for account settings and profile updates
 */

import { z } from 'zod'

// Update Profile Schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  phone: z
    .string()
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/m, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .min(8, 'Password must be at least 8 characters'),
    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Change Email Schema
export const changeEmailSchema = z
  .object({
    newEmail: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    confirmEmail: z
      .string()
      .min(1, 'Please confirm your email'),
  })
  .refine((data) => data.newEmail === data.confirmEmail, {
    message: "Emails don't match",
    path: ['confirmEmail'],
  })

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>
