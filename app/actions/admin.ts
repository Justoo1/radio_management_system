'use server'

/**
 * Admin Server Actions
 * Handles admin operations like activating/deactivating organizations
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { checkDeveloperAccess } from './developer'

/**
 * Check if user is an admin (developer access via security key)
 */
async function isAdmin(): Promise<boolean> {
  // Check for developer access cookie
  const hasDeveloperAccess = await checkDeveloperAccess()
  return hasDeveloperAccess
}

/**
 * Get all organizations for admin dashboard
 * Only accessible to developers with valid security key
 */
export async function getAllOrganizations(filters?: {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  try {
    // Verify developer access
    if (!(await isAdmin())) {
      throw new Error('Unauthorized - Developer access required')
    }

    // Get pagination params
    const page = filters?.page || 1
    const pageSize = filters?.pageSize || 10
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { slug: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const totalCount = await prisma.organization.count({ where })

    // Get organizations with pagination
    const organizations = await prisma.organization.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    })

    // Format response
    const formattedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      status: org.status,
      owner: org.owner,
      trialEndDate: org.trialEndDate,
      isTrialUsed: org.isTrialUsed,
      subscription: org.subscription ? {
        id: org.subscription.id,
        planName: org.subscription.plan.name,
        planPrice: parseFloat(org.subscription.plan.price.toString()),
        status: org.subscription.status,
        currentPeriodEnd: org.subscription.currentPeriodEnd,
        nextPaymentDate: org.subscription.nextPaymentDate,
      } : null,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    }))

    return {
      success: true,
      organizations: formattedOrganizations,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    }
  } catch (error) {
    console.error('Error getting organizations:', error)
    throw error
  }
}

/**
 * Activate an organization
 * Called when payment has been verified
 */
export async function activateOrganizationAdmin(
  organizationId: string,
  notes?: string
) {
  try {
    // Verify developer access
    if (!(await isAdmin())) {
      throw new Error('Only developers can perform this action')
    }

    const session = await auth()

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Update organization status
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'ACTIVE',
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    // Update subscription status if it exists
    if (organization.subscription) {
      await prisma.subscription.update({
        where: { id: organization.subscription.id },
        data: {
          status: 'ACTIVE',
          lastPaymentDate: new Date(),
          nextPaymentDate: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
        },
      })
    }

    // Log the action (if session available)
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: 'ACTIVATED',
          resource: 'Organization',
          resourceId: organizationId,
          description: `Organization activated by developer. Notes: ${notes || 'Payment verified'}`,
        },
      })
    }

    return {
      success: true,
      message: 'Organization activated successfully',
      organization: updatedOrg,
    }
  } catch (error) {
    console.error('Error activating organization:', error)
    throw error
  }
}

/**
 * Deactivate/Suspend an organization
 * Called for non-payment or other reasons
 */
export async function deactivateOrganizationAdmin(
  organizationId: string,
  reason: string,
  sendNotification?: boolean
) {
  try {
    // Verify developer access
    if (!(await isAdmin())) {
      throw new Error('Only developers can perform this action')
    }

    const session = await auth()

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { subscription: true, owner: true },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Update organization status
    const updatedOrg = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
      },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    })

    // Update subscription status if it exists
    if (organization.subscription) {
      await prisma.subscription.update({
        where: { id: organization.subscription.id },
        data: {
          status: 'PAST_DUE',
        },
      })
    }

    // Log the action (if session available)
    if (session?.user?.id) {
      await prisma.activityLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: 'SUSPENDED',
          resource: 'Organization',
          resourceId: organizationId,
          description: `Organization suspended by developer. Reason: ${reason}`,
        },
      })
    }

    // TODO: Send email notification to organization owner if sendNotification is true
    if (sendNotification && organization.owner) {
      // Email should be sent here
      console.log(`Email notification would be sent to ${organization.owner.email}`)
    }

    return {
      success: true,
      message: 'Organization suspended successfully',
      reason,
      organization: updatedOrg,
    }
  } catch (error) {
    console.error('Error deactivating organization:', error)
    throw error
  }
}

/**
 * Get organization details for admin
 */
export async function getOrganizationDetailsAdmin(organizationId: string) {
  try {
    // Verify developer access
    if (!(await isAdmin())) {
      throw new Error('Only developers can view this information')
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        subscription: {
          include: {
            plan: true,
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            createdAt: true,
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    // Format the response to convert Decimal to number
    const formattedOrganization = {
      ...organization,
      subscription: organization.subscription ? {
        ...organization.subscription,
        plan: {
          ...organization.subscription.plan,
          price: parseFloat(organization.subscription.plan.price.toString()),
        },
      } : null,
    }

    return {
      success: true,
      organization: formattedOrganization,
    }
  } catch (error) {
    console.error('Error getting organization details:', error)
    throw error
  }
}

/**
 * Get statistics for admin dashboard
 */
export async function getAdminDashboardStats() {
  try {
    // Verify developer access
    if (!(await isAdmin())) {
      throw new Error('Only developers can view dashboard statistics')
    }

    // Count organizations by status
    const statusCounts = {
      trial: await prisma.organization.count({ where: { status: 'TRIAL' } }),
      active: await prisma.organization.count({ where: { status: 'ACTIVE' } }),
      suspended: await prisma.organization.count({
        where: { status: 'SUSPENDED' },
      }),
      expired: await prisma.organization.count({ where: { status: 'EXPIRED' } }),
      cancelled: await prisma.organization.count({
        where: { status: 'CANCELLED' },
      }),
    }

    // Get upcoming payment dates
    const upcomingPayments = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextPaymentDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          gt: new Date(),
        },
      },
      include: {
        organization: {
          select: { id: true, name: true, email: true },
        },
        plan: {
          select: { name: true, price: true },
        },
      },
      orderBy: { nextPaymentDate: 'asc' },
      take: 10,
    })

    // Get expiring trials
    const expiringTrials = await prisma.organization.findMany({
      where: {
        status: 'TRIAL',
        trialEndDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          gt: new Date(),
        },
      },
      select: { id: true, name: true, email: true, trialEndDate: true },
      orderBy: { trialEndDate: 'asc' },
      take: 10,
    })

    // Total revenue (sum of all subscription prices for active subscriptions)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    })

    const totalRevenue = subscriptions.reduce(
      (sum, sub) => sum + parseFloat(sub.plan.price.toString()),
      0
    )

    return {
      success: true,
      stats: {
        organizations: {
          total: await prisma.organization.count(),
          byStatus: statusCounts,
        },
        subscriptions: {
          totalActive: subscriptions.length,
          estimatedMonthlyRevenue: totalRevenue,
        },
        alerts: {
          upcomingPayments: upcomingPayments.length,
          expiringTrials: expiringTrials.length,
        },
      },
      upcomingPayments,
      expiringTrials,
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    throw error
  }
}
