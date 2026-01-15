/**
 * Payment Account Validation Schemas
 * For Paystack subaccount setup (bank and mobile money)
 */

import { z } from 'zod'

// Bank account setup schema
export const bankAccountSetupSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountNumber: z.string().min(10, 'Account number must be at least 10 digits').max(10, 'Account number must be exactly 10 digits'),
  bankCode: z.string().min(1, 'Bank is required'),
})

// Mobile money account setup schema
export const momoAccountSetupSchema = z.object({
  momoName: z.string().min(1, 'Account name is required'),
  momoNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  momoProvider: z.enum(['mtn', 'vod', 'tgo'], {
    message: 'Invalid mobile money provider'
  }),
})

// Combined payment account setup schema
export const paymentAccountSetupSchema = z.discriminatedUnion('settlementType', [
  z.object({
    settlementType: z.literal('bank'),
    ...bankAccountSetupSchema.shape,
  }),
  z.object({
    settlementType: z.literal('mobile_money'),
    ...momoAccountSetupSchema.shape,
  }),
])

export type PaymentAccountSetupInput = z.infer<typeof paymentAccountSetupSchema>
