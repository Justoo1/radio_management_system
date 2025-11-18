'use server'

/**
 * Expense Management Server Actions
 * Handles expense operations (create, read, update, delete)
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ListExpensesInput,
} from '@/lib/validations/expense'
import { ZodError } from 'zod'

// Types for responses
export interface ExpenseResponse {
  id: string
  category: string
  description: string | null
  amount: number
  expenseDate: Date
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface ExpensesListResponse {
  data: ExpenseResponse[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  summary: {
    totalExpenses: number
    totalAmount: number
    averageAmount: number
    byCategory: Record<string, number>
  }
}

// Helper function to convert Decimal objects to numbers
function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj.toNumber === 'function') {
    return obj.toNumber()
  }

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalToNumber)
  }

  if (typeof obj === 'object' && obj.constructor.name !== 'Date') {
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertDecimalToNumber(obj[key])
    }
    return converted
  }

  return obj
}

// Helper function to get user's organization
async function getUserOrganization() {
  const session = await auth()

  if (!session || !session.user?.email) {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true },
  })

  if (!user || !user.organizationId) {
    throw new Error('User or organization not found')
  }

  return { user, organizationId: user.organizationId }
}

/**
 * Fetch expenses with filtering and pagination
 */
export async function fetchExpenses(
  params: ListExpensesInput
): Promise<ExpensesListResponse> {
  try {
    const { organizationId } = await getUserOrganization()

    // Validate parameters
    const validatedParams = listExpensesSchema.parse(params)

    const where = {
      organizationId,
      ...(validatedParams.search && {
        OR: [
          { category: { contains: validatedParams.search, mode: 'insensitive' as any } },
          { description: { contains: validatedParams.search, mode: 'insensitive' as any } },
          { notes: { contains: validatedParams.search, mode: 'insensitive' as any } },
        ],
      }),
      ...(validatedParams.status && { status: validatedParams.status }),
      ...(validatedParams.category && { category: validatedParams.category }),
      ...(validatedParams.startDate &&
        validatedParams.endDate && {
          expenseDate: {
            gte: new Date(validatedParams.startDate),
            lte: new Date(validatedParams.endDate),
          },
        }),
    }

    // Get total count
    const total = await prisma.expense.count({ where })

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      skip: (validatedParams.page - 1) * validatedParams.pageSize,
      take: validatedParams.pageSize,
    })

    // Calculate summary
    const allExpenses = await prisma.expense.findMany({
      where: { organizationId },
      select: { amount: true, category: true },
    })

    const totalAmount = allExpenses.reduce((sum: number, exp: { amount: any; category: string }) => sum + Number(exp.amount), 0)
    const averageAmount = allExpenses.length > 0 ? totalAmount / allExpenses.length : 0

    const byCategory: Record<string, number> = {}
    allExpenses.forEach((exp: { amount: any; category: string }) => {
      const amount = Number(exp.amount)
      byCategory[exp.category] = (byCategory[exp.category] || 0) + amount
    })

    const totalPages = Math.ceil(total / validatedParams.pageSize)

    return {
      data: convertDecimalToNumber(expenses),
      pagination: {
        page: validatedParams.page,
        pageSize: validatedParams.pageSize,
        total,
        totalPages,
        hasMore: validatedParams.page < totalPages,
      },
      summary: {
        totalExpenses: allExpenses.length,
        totalAmount,
        averageAmount,
        byCategory,
      },
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Invalid input'
      throw new Error(`Invalid input: ${errorMessage}`)
    }
    console.error('Failed to fetch expenses:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch expenses')
  }
}

/**
 * Create a new expense
 */
export async function createExpense(input: CreateExpenseInput): Promise<ExpenseResponse> {
  try {
    const { organizationId } = await getUserOrganization()

    // Validate input
    const validatedInput = createExpenseSchema.parse(input)

    const expenseDate =
      validatedInput.expenseDate instanceof Date ? validatedInput.expenseDate : new Date(validatedInput.expenseDate)

    const expense = await prisma.expense.create({
      data: {
        organizationId,
        category: validatedInput.category,
        description: validatedInput.description || null,
        amount: validatedInput.amount,
        expenseDate,
        notes: validatedInput.notes || null,
        status: validatedInput.status || 'RECORDED',
      },
    })

    return convertDecimalToNumber(expense)
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Invalid input'
      throw new Error(`Invalid input: ${errorMessage}`)
    }
    console.error('Failed to create expense:', error)
    throw error instanceof Error ? error : new Error('Failed to create expense')
  }
}

/**
 * Update an expense
 */
export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<ExpenseResponse> {
  try {
    const { organizationId } = await getUserOrganization()

    // Validate input
    const validatedInput = updateExpenseSchema.parse(input)

    // Verify expense belongs to user's organization
    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense || expense.organizationId !== organizationId) {
      throw new Error('Expense not found or unauthorized')
    }

    const updateData: any = {}
    if (validatedInput.category !== undefined) updateData.category = validatedInput.category
    if (validatedInput.description !== undefined) updateData.description = validatedInput.description
    if (validatedInput.amount !== undefined) updateData.amount = validatedInput.amount
    if (validatedInput.notes !== undefined) updateData.notes = validatedInput.notes
    if (validatedInput.status !== undefined) updateData.status = validatedInput.status
    if (validatedInput.expenseDate !== undefined) {
      updateData.expenseDate =
        validatedInput.expenseDate instanceof Date ? validatedInput.expenseDate : new Date(validatedInput.expenseDate)
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
    })

    return convertDecimalToNumber(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessage = error.issues?.[0]?.message || 'Invalid input'
      throw new Error(`Invalid input: ${errorMessage}`)
    }
    console.error('Failed to update expense:', error)
    throw error instanceof Error ? error : new Error('Failed to update expense')
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<void> {
  try {
    const { organizationId } = await getUserOrganization()

    // Verify expense belongs to user's organization
    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense || expense.organizationId !== organizationId) {
      throw new Error('Expense not found or unauthorized')
    }

    await prisma.expense.delete({ where: { id } })
  } catch (error) {
    console.error('Failed to delete expense:', error)
    throw error instanceof Error ? error : new Error('Failed to delete expense')
  }
}

/**
 * Get expense categories for the organization
 */
export async function getExpenseCategories(): Promise<string[]> {
  try {
    const { organizationId } = await getUserOrganization()

    const expenses = await prisma.expense.findMany({
      where: { organizationId },
      distinct: ['category'],
      select: { category: true },
    })

    return expenses.map((e) => e.category).sort()
  } catch (error) {
    console.error('Failed to fetch expense categories:', error)
    throw error instanceof Error ? error : new Error('Failed to fetch expense categories')
  }
}
