import { z } from 'zod'

export const createExpenseSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  expenseDate: z.date().or(z.string().datetime()),
  notes: z.string().optional(),
  status: z.enum(['RECORDED', 'APPROVED', 'PAID', 'CANCELLED']).optional().default('RECORDED'),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export const listExpensesSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  status: z.enum(['RECORDED', 'APPROVED', 'PAID', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
})

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ListExpensesInput = z.infer<typeof listExpensesSchema>
