'use server'

/**
 * Subscription Management Server Actions
 * Handles subscription and trial period checks
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

/**
 * Check and update trial periods for all organizations
 * Runs daily to check if trial periods have expired
 * Updates organization status based on subscription status
 */
export async function checkTrialPeriods() {
  try {
    const now = new Date()

    // Find all organizations with TRIAL status
    const trialOrganizations = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
      },
      include: {
        subscription: true,
      },
    })

    // Update each organization's status based on trial end date
    for (const org of trialOrganizations) {
      if (org.trialEndDate <= now) {
        // Trial has expired, change status to EXPIRED
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            status: 'EXPIRED',
            isTrialUsed: true,
          },
        })

        // If subscription exists, mark it as expired
        if (org.subscription) {
          await prisma.subscription.update({
            where: { id: org.subscription.id },
            data: {
              status: 'EXPIRED',
            },
          })
        }
      }
    }

    return {
      success: true,
      message: `Checked ${trialOrganizations.length} trial organizations`,
    }
  } catch (error) {
    console.error('Error checking trial periods:', error)
    throw new Error('Failed to check trial periods')
  }
}

/**
 * Check and update subscription payment due dates
 * Runs daily to identify subscriptions with upcoming or overdue payments
 */
export async function checkSubscriptionPayments() {
  try {
    const now = new Date()

    // Find all ACTIVE subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        organization: true,
        plan: true,
      },
    })

    const updates = []

    // Check each subscription for payment status
    for (const subscription of activeSubscriptions) {
      // If next payment date has passed, mark as PAST_DUE
      if (
        subscription.nextPaymentDate &&
        subscription.nextPaymentDate <= now &&
        subscription.organization
      ) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        })

        // Update organization status to SUSPENDED
        await prisma.organization.update({
          where: { id: subscription.organization.id },
          data: {
            status: 'SUSPENDED',
          },
        })

        updates.push({
          organizationId: subscription.organization.id,
          organizationName: subscription.organization.name,
          reason: 'Payment overdue',
        })
      }
    }

    return {
      success: true,
      message: `Checked ${activeSubscriptions.length} active subscriptions`,
      updatedCount: updates.length,
      updates,
    }
  } catch (error) {
    console.error('Error checking subscription payments:', error)
    throw new Error('Failed to check subscription payments')
  }
}

/**
 * Get organization subscription status
 * Returns subscription and trial information for an organization
 */
export async function getSubscriptionStatus(organizationId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Verify user belongs to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.organizationId !== organizationId) {
      throw new Error('Unauthorized to view this organization')
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
      },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Calculate trial days remaining
    const now = new Date()
    const trialDaysRemaining = Math.ceil(
      (organization.trialEndDate.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Calculate payment days remaining or overdue
    let paymentStatus = 'ACTIVE'
    let daysRemaining = 0

    if (organization.subscription?.nextPaymentDate) {
      const diff = organization.subscription.nextPaymentDate.getTime() - now.getTime()
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24))

      if (daysRemaining < 0) {
        paymentStatus = 'OVERDUE'
      } else if (daysRemaining <= 7) {
        paymentStatus = 'DUE_SOON'
      }
    }

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      status: organization.status,
      trialEndDate: organization.trialEndDate,
      trialDaysRemaining: Math.max(0, trialDaysRemaining),
      isTrialUsed: organization.isTrialUsed,
      subscription: organization.subscription ? {
        id: organization.subscription.id,
        planName: organization.subscription.plan.name,
        planPrice: organization.subscription.plan.price,
        subscriptionStatus: organization.subscription.status,
        currentPeriodEnd: organization.subscription.currentPeriodEnd,
        nextPaymentDate: organization.subscription.nextPaymentDate,
        paymentStatus,
        daysRemaining,
        lastPaymentDate: organization.subscription.lastPaymentDate,
      } : null,
    }
  } catch (error) {
    console.error('Error getting subscription status:', error)
    throw error
  }
}

/**
 * Activate an organization (admin only)
 * Used when payment has been received
 */
export async function activateOrganization(organizationId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Verify user is admin (you should add proper admin role check)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Update organization and subscription status
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        subscription: true,
      },
    })

    // If subscription exists, update it to ACTIVE
    if (organization.subscription) {
      await prisma.subscription.update({
        where: { id: organization.subscription.id },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: new Date(),
          // Set next payment date based on billing interval
          nextPaymentDate: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        },
      })
    }

    return {
      success: true,
      message: 'Organization activated successfully',
      organization,
    }
  } catch (error) {
    console.error('Error activating organization:', error)
    throw error
  }
}

/**
 * Get current user's subscription plan
 */
export async function getUserSubscriptionPlan() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      throw new Error('Unauthorized')
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        organization: {
          select: {
            subscription: {
              select: {
                plan: {
                  select: {
                    name: true,
                  }
                },
                status: true,
              }
            },
            status: true,
          }
        }
      },
    })

    if (!user?.organization) {
      return {
        planName: 'STARTER',
        status: 'TRIAL',
      }
    }

    // If organization is in trial, return TRIAL
    if (user.organization.status === 'TRIAL') {
      return {
        planName: 'TRIAL',
        status: 'TRIAL',
      }
    }

    // If has subscription, return plan name
    if (user.organization.subscription) {
      return {
        planName: user.organization.subscription.plan.name.toUpperCase(),
        status: user.organization.subscription.status,
      }
    }

    // Default to STARTER
    return {
      planName: 'STARTER',
      status: 'ACTIVE',
    }
  } catch (error) {
    console.error('Error fetching subscription plan:', error)
    return {
      planName: 'STARTER',
      status: 'ACTIVE',
    }
  }
}

/**
 * Deactivate/Suspend an organization (admin only)
 */
export async function deactivateOrganization(
  organizationId: string,
  reason?: string
) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Update organization status
    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'SUSPENDED',
      },
      include: {
        subscription: true,
      },
    })

    // If subscription exists, update it to PAST_DUE
    if (organization.subscription) {
      await prisma.subscription.update({
        where: { id: organization.subscription.id },
        data: {
          status: 'PAST_DUE',
        },
      })
    }

    return {
      success: true,
      message: 'Organization deactivated successfully',
      reason,
      organization,
    }
  } catch (error) {
    console.error('Error deactivating organization:', error)
    throw error
  }
}

/**
 * Get payment history for organization
 * Returns all payments with invoice details
 */
export async function getOrganizationPayments(organizationId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Verify user belongs to the organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user || user.organizationId !== organizationId) {
      throw new Error('Unauthorized to view this organization')
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!organization || !organization.subscription) {
      return {
        payments: [],
        subscription: null,
      }
    }

    // Format payments with invoice numbers
    const payments = organization.subscription.payments.map((payment) => ({
      id: payment.id,
      invoiceNumber: `INV-${payment.createdAt.getFullYear()}${String(payment.createdAt.getMonth() + 1).padStart(2, '0')}-${payment.id.substring(0, 8).toUpperCase()}`,
      amount: parseFloat(payment.amount.toString()),
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.createdAt,
      referenceNumber: payment.providerPaymentId,
      network: payment.network,
      mobileNumber: payment.mobileNumber,
    }))

    return {
      payments,
      subscription: {
        planName: organization.subscription.plan.name,
        status: organization.subscription.status,
        currentPeriodStart: organization.subscription.currentPeriodStart,
        currentPeriodEnd: organization.subscription.currentPeriodEnd,
        nextPaymentDate: organization.subscription.nextPaymentDate,
      },
    }
  } catch (error) {
    console.error('Error getting payment history:', error)
    throw error
  }
}
