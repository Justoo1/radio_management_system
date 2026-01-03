/**
 * Admin API: Update Organization Subscription Plan
 * Allows admin to upgrade/downgrade organization plans
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

/**
 * GET: Get available subscription plans
 */
export async function GET(request: NextRequest) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json(
        { error: 'Unauthorized - Developer access required' },
        { status: 401 }
      )
    }

    // Get all available subscription plans
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        billingInterval: true,
        maxUsers: true,
        maxClients: true,
        maxSMSPerMonth: true,
        maxStorageGB: true,
        maxPrograms: true,
        features: true,
        sortOrder: true,
      },
    })

    // Convert Decimal to number for JSON serialization
    const formattedPlans = plans.map((plan) => ({
      ...plan,
      price: parseFloat(plan.price.toString()),
    }))

    return NextResponse.json({
      success: true,
      plans: formattedPlans,
    })
  } catch (error) {
    console.error('Error fetching subscription plans:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update organization subscription plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for developer access cookie
    const cookieStore = await cookies()
    const devAccessToken = cookieStore.get('dev_access_token')

    if (!devAccessToken || !devAccessToken.value) {
      return NextResponse.json(
        { error: 'Unauthorized - Developer access required' },
        { status: 401 }
      )
    }

    const { planId, notes } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      )
    }

    // Await params in Next.js 15+
    const { id: organizationId } = await params

    // Verify the plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Get organization and current subscription
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    let updatedSubscription

    if (organization.subscription) {
      // Update existing subscription
      updatedSubscription = await prisma.subscription.update({
        where: { id: organization.subscription.id },
        data: {
          planId: planId,
          // Reset payment dates when changing plan
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
          nextPaymentDate: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
          // Keep status as is, or set to ACTIVE if it was TRIALING
          status:
            organization.subscription.status === 'TRIALING'
              ? 'ACTIVE'
              : organization.subscription.status,
        },
        include: {
          plan: true,
        },
      })

      // Update organization limits based on new plan
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          maxUsers: plan.maxUsers,
          maxClients: plan.maxClients,
          maxSMSPerMonth: plan.maxSMSPerMonth,
          maxStorageGB: plan.maxStorageGB,
        },
      })

      // Log the action using organization owner's userId (required by ActivityLog schema)
      if (organization.ownerId) {
        await prisma.activityLog.create({
          data: {
            organizationId,
            userId: organization.ownerId,
            action: 'PLAN_CHANGED',
            resource: 'Subscription',
            resourceId: updatedSubscription.id,
            description: `Plan changed from ${organization.subscription.plan.name} to ${plan.name} by admin. ${notes ? `Notes: ${notes}` : ''}`,
          },
        })
      }
    } else {
      // Create new subscription if none exists
      updatedSubscription = await prisma.subscription.create({
        data: {
          planId: planId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
          nextPaymentDate: new Date(
            new Date().setMonth(new Date().getMonth() + 1)
          ),
          status: 'ACTIVE',
        },
        include: {
          plan: true,
        },
      })

      // Link subscription to organization
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionId: updatedSubscription.id,
          maxUsers: plan.maxUsers,
          maxClients: plan.maxClients,
          maxSMSPerMonth: plan.maxSMSPerMonth,
          maxStorageGB: plan.maxStorageGB,
          status: 'ACTIVE',
        },
      })

      // Log the action using organization owner's userId (required by ActivityLog schema)
      if (organization.ownerId) {
        await prisma.activityLog.create({
          data: {
            organizationId,
            userId: organization.ownerId,
            action: 'SUBSCRIPTION_CREATED',
            resource: 'Subscription',
            resourceId: updatedSubscription.id,
            description: `Subscription created with ${plan.name} plan by admin. ${notes ? `Notes: ${notes}` : ''}`,
          },
        })
      }
    }

    // Format response
    const formattedSubscription = {
      ...updatedSubscription,
      plan: {
        ...updatedSubscription.plan,
        price: parseFloat(updatedSubscription.plan.price.toString()),
      },
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription plan updated successfully',
      subscription: formattedSubscription,
    })
  } catch (error) {
    console.error('Error updating subscription plan:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
