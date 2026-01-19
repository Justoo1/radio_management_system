'use server'

/**
 * Subscription Payment Management Server Actions
 * Replaces old Bill-based system with SubscriptionPayment
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

interface PendingPaymentInfo {
  id: string
  amount: number
  currency: string
  status: string
  dueDate: string
  periodEnd: string
  planName: string
  description: string | null
}

/**
 * Get pending/due subscription payments for the current user's organization
 */
export async function getPendingBills(): Promise<{
  success: boolean
  error?: string
  bills: PendingPaymentInfo[]
}> {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return { success: false, error: 'Unauthorized', bills: [] }
    }

    // Get organization with subscription info
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        id: true,
        status: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            nextPaymentDate: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
              },
            },
            payments: {
              where: {
                status: {
                  in: ['PENDING', 'FAILED'],
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5, // Get last 5 pending/failed payments
            },
          },
        },
      },
    })

    if (!organization) {
      return { success: false, error: 'Organization not found', bills: [] }
    }

    const bills: PendingPaymentInfo[] = []

    // If there are pending/failed payments, show them
    if (organization.subscription?.payments?.length) {
      for (const payment of organization.subscription.payments) {
        bills.push({
          id: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          dueDate: organization.subscription.nextPaymentDate?.toISOString() ||
                   organization.subscription.currentPeriodEnd.toISOString(),
          periodEnd: organization.subscription.currentPeriodEnd.toISOString(),
          planName: organization.subscription.plan.name,
          description: payment.description,
        })
      }
    }

    // If subscription is past due or expired but no pending payment record exists,
    // create a virtual pending payment for display
    if (
      organization.subscription &&
      (organization.subscription.status === 'PAST_DUE' ||
       organization.subscription.status === 'EXPIRED') &&
      bills.length === 0
    ) {
      bills.push({
        id: 'renewal-required',
        amount: Number(organization.subscription.plan.price),
        currency: organization.subscription.plan.currency,
        status: organization.subscription.status === 'EXPIRED' ? 'OVERDUE' : 'PENDING',
        dueDate: organization.subscription.currentPeriodEnd.toISOString(),
        periodEnd: organization.subscription.currentPeriodEnd.toISOString(),
        planName: organization.subscription.plan.name,
        description: `${organization.subscription.plan.name} subscription renewal`,
      })
    }

    // Also check if subscription period is ending soon (within 7 days)
    if (
      organization.subscription &&
      organization.subscription.status === 'ACTIVE' &&
      bills.length === 0
    ) {
      const periodEnd = new Date(organization.subscription.currentPeriodEnd)
      const now = new Date()
      const daysUntilEnd = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
        bills.push({
          id: 'upcoming-renewal',
          amount: Number(organization.subscription.plan.price),
          currency: organization.subscription.plan.currency,
          status: 'UPCOMING',
          dueDate: organization.subscription.nextPaymentDate?.toISOString() || periodEnd.toISOString(),
          periodEnd: periodEnd.toISOString(),
          planName: organization.subscription.plan.name,
          description: `${organization.subscription.plan.name} subscription renewal - Due in ${daysUntilEnd} days`,
        })
      }
    }

    return { success: true, bills }
  } catch (error) {
    console.error('Error fetching subscription payments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment info',
      bills: [],
    }
  }
}

/**
 * Get subscription payment history
 */
export async function getPaymentHistory(): Promise<{
  success: boolean
  error?: string
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paymentMethod: string
    paidAt: string | null
    createdAt: string
    description: string | null
  }>
}> {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return { success: false, error: 'Unauthorized', payments: [] }
    }

    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: {
        subscription: {
          select: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
      },
    })

    if (!organization?.subscription) {
      return { success: true, payments: [] }
    }

    return {
      success: true,
      payments: organization.subscription.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
        description: p.description,
      })),
    }
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment history',
      payments: [],
    }
  }
}

/**
 * Mark a subscription payment as paid (admin only)
 * @deprecated Use the subscription verify endpoint instead
 */
export async function markBillAsPaid(
  paymentId: string,
  paymentMethod: string,
  paymentRef: string,
  notes?: string
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    })

    if (!user || (user.role?.name !== 'OWNER' && user.role?.name !== 'ADMIN')) {
      return { success: false, error: 'Unauthorized - Admin access required' }
    }

    const payment = await prisma.subscriptionPayment.update({
      where: { id: paymentId },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        providerPaymentId: paymentRef,
        description: notes || undefined,
      },
    })

    return {
      success: true,
      message: 'Payment marked as paid successfully',
      payment: {
        id: payment.id,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString(),
      },
    }
  } catch (error) {
    console.error('Error marking payment as paid:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark payment as paid',
    }
  }
}
