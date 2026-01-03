/**
 * Admin Revenue API
 * Provides detailed revenue analytics and payment tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate = new Date()

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date('2000-01-01')
        break
      default:
        startDate.setMonth(now.getMonth() - 1)
    }

    // Get all active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          where: {
            createdAt: {
              gte: startDate,
              lte: now,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    // Calculate monthly recurring revenue
    const monthlyRecurring = activeSubscriptions.reduce(
      (sum, sub) => sum + parseFloat(sub.plan.price.toString()),
      0
    )

    // Get all payments in date range
    const allPayments = await prisma.subscriptionPayment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        subscription: {
          include: {
            plan: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate total revenue from successful payments
    const totalRevenue = allPayments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)

    // Calculate previous period revenue for growth rate
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setTime(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    )

    const previousPeriodPayments = await prisma.subscriptionPayment.findMany({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        status: 'COMPLETED',
      },
    })

    const previousRevenue = previousPeriodPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.amount.toString()),
      0
    )

    const growthRate =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

    // Calculate ARPU
    const averageRevenuePerUser =
      activeSubscriptions.length > 0
        ? monthlyRecurring / activeSubscriptions.length
        : 0

    // Revenue by plan
    const revenueByPlan = activeSubscriptions.reduce((acc, sub) => {
      const planName = sub.plan.name
      const existing = acc.find((p) => p.plan === planName)

      if (existing) {
        existing.count++
        existing.revenue += parseFloat(sub.plan.price.toString())
      } else {
        acc.push({
          plan: planName,
          count: 1,
          revenue: parseFloat(sub.plan.price.toString()),
        })
      }

      return acc
    }, [] as { plan: string; count: number; revenue: number }[])

    // Format recent payments
    const recentPayments = allPayments.slice(0, 50).map((payment) => ({
      id: payment.id,
      organizationName: payment.subscription.organization?.name || 'Unknown',
      organizationId: payment.subscription.organization?.id || '',
      planName: payment.subscription.plan.name,
      amount: parseFloat(payment.amount.toString()),
      status: payment.status,
      date: payment.createdAt,
      paymentMethod: payment.paymentMethod,
    }))

    // Monthly trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now)
      monthStart.setMonth(now.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthStart.getMonth() + 1)

      const monthPayments = await prisma.subscriptionPayment.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
          status: 'COMPLETED',
        },
      })

      const monthRevenue = monthPayments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      )

      const monthSubscriptions = await prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          currentPeriodStart: {
            lte: monthEnd,
          },
        },
      })

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        revenue: monthRevenue,
        subscriptions: monthSubscriptions,
      })
    }

    return NextResponse.json({
      success: true,
      revenue: {
        summary: {
          totalRevenue,
          monthlyRecurring,
          activeSubscriptions: activeSubscriptions.length,
          averageRevenuePerUser,
          growthRate,
        },
        revenueByPlan,
        recentPayments,
        monthlyTrend,
      },
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
