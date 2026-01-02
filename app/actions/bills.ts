'use server'

/**
 * Bills Management Server Actions
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * Get pending bills for the current user's organization
 */
export async function getPendingBills() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized', bills: [] }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user) {
      return { success: false, error: 'User not found', bills: [] }
    }

    const bills = await prisma.bill.findMany({
      where: {
        organizationId: user.organizationId,
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return {
      success: true,
      bills: bills.map((bill) => ({
        id: bill.id,
        amount: Number(bill.amount),
        billingMonth: bill.billingMonth,
        billingYear: bill.billingYear,
        dueDate: bill.dueDate.toISOString(),
        status: bill.status,
        description: bill.description,
      })),
    }
  } catch (error) {
    console.error('Error fetching pending bills:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bills',
      bills: [],
    }
  }
}

/**
 * Mark a bill as paid (admin only)
 */
export async function markBillAsPaid(
  billId: string,
  paymentMethod: string,
  paymentRef: string,
  notes?: string
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' }
    }

    // In production, add proper admin check here

    const bill = await prisma.bill.update({
      where: { id: billId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: paymentMethod as any,
        paymentRef,
        notes,
      },
    })

    return {
      success: true,
      message: 'Bill marked as paid successfully',
      bill: {
        id: bill.id,
        status: bill.status,
        paidAt: bill.paidAt?.toISOString(),
      },
    }
  } catch (error) {
    console.error('Error marking bill as paid:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark bill as paid',
    }
  }
}
