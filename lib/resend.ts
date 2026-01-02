/**
 * Resend Email Client Configuration
 * Used for sending transactional emails (billing notifications, etc.)
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender email - update this to your verified domain
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@radiomgmt.com'
