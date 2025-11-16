/**
 * Program Validation Schemas
 * Zod schemas for program management forms
 */

import { z } from 'zod'

// Create/Update Program Schema
export const programSchema = z.object({
  name: z
    .string()
    .min(1, 'Program name is required')
    .min(2, 'Program name must be at least 2 characters')
    .max(100, 'Program name must be less than 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  targetAudience: z.string().optional(),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours'),
  hostId: z.string().optional(),
  coHosts: z.array(z.string()).optional(),
  thumbnailUrl: z
    .string()
    .url('Please enter a valid image URL')
    .optional()
    .or(z.literal('')),
  promoAudioUrl: z
    .string()
    .url('Please enter a valid audio URL')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
})

export type ProgramInput = z.infer<typeof programSchema>

// Program Schedule Schema
export const programScheduleSchema = z.object({
  dayOfWeek: z
    .number()
    .min(0, 'Invalid day of week')
    .max(6, 'Invalid day of week'),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  isRecurring: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
})

export type ProgramScheduleInput = z.infer<typeof programScheduleSchema>

// Program Episode Schema
export const programEpisodeSchema = z.object({
  episodeNumber: z.number().min(1).optional(),
  title: z
    .string()
    .min(1, 'Episode title is required')
    .min(2, 'Episode title must be at least 2 characters')
    .max(200, 'Episode title must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  airDate: z
    .string()
    .datetime('Please enter a valid date and time'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .optional(),
  audioFileUrl: z
    .string()
    .url('Please enter a valid audio URL')
    .optional()
    .or(z.literal('')),
  transcript: z.string().optional(),
  guestNames: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
  status: z.enum(['SCHEDULED', 'RECORDED', 'AIRED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
})

export type ProgramEpisodeInput = z.infer<typeof programEpisodeSchema>

// Program Filter Schema
export const programFilterSchema = z.object({
  search: z.string().optional(),
  genre: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  sortBy: z.enum(['name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type ProgramFilterInput = z.infer<typeof programFilterSchema>
