/**
 * Admin Revenue API
 * Provides detailed revenue analytics and payment tracking
 * OPTIMIZED: Reduced from 15+ queries to 4 queries
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { CACHE_KEYS, CACHE_TTL, cacheAside } from '@/lib/cache'

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

    // Try to get from cache first
    const cacheKey = `${CACHE_KEYS.adminRevenue()}:${range}`
    const cachedData = await cacheAside(
      cacheKey,
      CACHE_TTL.REPORT_DATA,
      async () => fetchRevenueData(range)
    )

    return NextResponse.json({
      success: true,
      revenue: cachedData,
    })
  } catch (error) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}

async function fetchRevenueData(range: string) {
  // Calculate date ranges
  const now = new Date()
  let startDate = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)

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

  // Calculate previous period for growth rate
  const periodLength = now.getTime() - startDate.getTime()
  const previousPeriodStart = new Date(startDate.getTime() - periodLength)

  // OPTIMIZED: Fetch all data in parallel with single queries
  const [
    activeSubscriptions,
    allPaymentsInRange,
    previousPeriodPayments,
    allPaymentsLast6Months,
  ] = await Promise.all([
    // Query 1: Active subscriptions with plan info
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        plan: {
          select: {
            name: true,
            price: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    // Query 2: All payments in current date range (with details for recent payments)
    prisma.subscriptionPayment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        paymentMethod: true,
        subscription: {
          select: {
            plan: {
              select: { name: true },
            },
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to prevent huge data transfer
    }),

    // Query 3: Previous period payments for growth calculation (just amounts)
    prisma.subscriptionPayment.aggregate({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),

    // Query 4: All payments in last 6 months for trend (minimal data)
    prisma.subscriptionPayment.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
          lte: now,
        },
        status: 'COMPLETED',
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }),
  ])

  // Calculate monthly recurring revenue
  const monthlyRecurring = activeSubscriptions.reduce(
    (sum, sub) => sum + parseFloat(sub.plan.price.toString()),
    0
  )

  // Calculate total revenue from successful payments
  const totalRevenue = allPaymentsInRange
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0)

  // Previous period revenue (already aggregated)
  const previousRevenue = parseFloat(
    previousPeriodPayments._sum.amount?.toString() || '0'
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
  const revenueByPlan = activeSubscriptions.reduce(
    (acc, sub) => {
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
    },
    [] as { plan: string; count: number; revenue: number }[]
  )

  // Format recent payments
  const recentPayments = allPaymentsInRange.slice(0, 50).map((payment) => ({
    id: payment.id,
    organizationName: payment.subscription.organization?.name || 'Unknown',
    organizationId: payment.subscription.organization?.id || '',
    planName: payment.subscription.plan.name,
    amount: parseFloat(payment.amount.toString()),
    status: payment.status,
    date: payment.createdAt,
    paymentMethod: payment.paymentMethod,
  }))

  // OPTIMIZED: Calculate monthly trend from pre-fetched data (no loops with queries!)
  const monthlyTrend = calculateMonthlyTrend(allPaymentsLast6Months, activeSubscriptions.length)

  return {
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
  }
}

/**
 * Calculate monthly trend from pre-fetched payment data
 * No database queries - pure JavaScript aggregation
 */
function calculateMonthlyTrend(
  payments: { amount: any; createdAt: Date }[],
  currentActiveSubscriptions: number
) {
  const now = new Date()
  const trend = []

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now)
    monthStart.setMonth(now.getMonth() - i)
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const monthEnd = new Date(monthStart)
    monthEnd.setMonth(monthStart.getMonth() + 1)

    // Filter payments for this month
    const monthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.createdAt)
      return paymentDate >= monthStart && paymentDate < monthEnd
    })

    // Sum revenue for this month
    const monthRevenue = monthPayments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    )

    // Estimate subscriptions (use current count for recent months, decrease for older)
    // This is an approximation since we don't have historical subscription counts
    const monthsAgo = i
    const estimatedSubscriptions = Math.max(
      1,
      Math.round(currentActiveSubscriptions * (1 - monthsAgo * 0.05))
    )

    trend.push({
      month: monthStart.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: monthRevenue,
      subscriptions: i === 0 ? currentActiveSubscriptions : estimatedSubscriptions,
    })
  }

  return trend
}

export const dynamic = 'force-dynamic'
