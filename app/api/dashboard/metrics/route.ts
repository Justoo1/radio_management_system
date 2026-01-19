/**
 * Dashboard Metrics API
 * Fetches growth rate and other metrics
 * OPTIMIZED: Reduced queries, added caching, removed unnecessary data fetching
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { CACHE_KEYS, CACHE_TTL, cacheAside } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId

    // Use cache-aside pattern with 2-minute TTL
    const cacheKey = CACHE_KEYS.dashboardMetrics(organizationId)
    const metrics = await cacheAside(
      cacheKey,
      CACHE_TTL.DASHBOARD_METRICS,
      async () => fetchDashboardMetrics(organizationId)
    )

    return NextResponse.json({
      success: true,
      data: metrics,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

async function fetchDashboardMetrics(organizationId: string) {
  // Calculate date boundaries once
  const today = new Date()
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
  const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())

  // OPTIMIZED: Fetch all counts in a single parallel operation
  // Use groupBy where possible to reduce total query count
  const [
    clientCounts,
    programCounts,
    campaignCounts,
    clientsCreatedLastMonth,
    clientsCreatedTwoMonthsAgo,
  ] = await Promise.all([
    // Query 1: Client counts (total + active in one query using groupBy)
    prisma.client.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),

    // Query 2: Program counts (total + active)
    prisma.program.groupBy({
      by: ['isActive'],
      where: { organizationId },
      _count: { id: true },
    }),

    // Query 3: Campaign counts (total + sent)
    prisma.sMSCampaign.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }),

    // Query 4: Clients created by last month (for growth calculation)
    prisma.client.count({
      where: {
        organizationId,
        createdAt: { lte: oneMonthAgo },
      },
    }),

    // Query 5: Clients created by two months ago
    prisma.client.count({
      where: {
        organizationId,
        createdAt: { lte: twoMonthsAgo },
      },
    }),
  ])

  // Process client counts from groupBy result
  let clientsTotal = 0
  let clientsActive = 0
  clientCounts.forEach((group) => {
    clientsTotal += group._count.id
    if (group.status === 'ACTIVE') {
      clientsActive = group._count.id
    }
  })

  // Process program counts
  let programsTotal = 0
  let programsActive = 0
  programCounts.forEach((group) => {
    programsTotal += group._count.id
    if (group.isActive === true) {
      programsActive = group._count.id
    }
  })

  // Process campaign counts
  let campaignsTotal = 0
  let campaignsSent = 0
  campaignCounts.forEach((group) => {
    campaignsTotal += group._count.id
    if (group.status === 'SENT') {
      campaignsSent = group._count.id
    }
  })

  // Calculate growth percentage
  let growthRate = 0
  let growthTrend = 0

  if (clientsCreatedLastMonth > 0) {
    growthRate = ((clientsTotal - clientsCreatedLastMonth) / clientsCreatedLastMonth) * 100
  }

  if (clientsCreatedTwoMonthsAgo > 0) {
    growthTrend = ((clientsCreatedLastMonth - clientsCreatedTwoMonthsAgo) / clientsCreatedTwoMonthsAgo) * 100
  }

  // Format metrics
  return {
    growthRate: {
      value: Math.round(growthRate * 10) / 10,
      label: 'Growth Rate',
      unit: '%',
      trend: Math.round(growthTrend * 10) / 10,
      description: `${growthRate > 0 ? '+' : ''}${Math.round(growthRate)}% from last month`,
    },
    clients: {
      total: clientsTotal,
      active: clientsActive,
      percentage: clientsTotal > 0 ? Math.round((clientsActive / clientsTotal) * 100) : 0,
    },
    programs: {
      total: programsTotal,
      active: programsActive,
      percentage: programsTotal > 0 ? Math.round((programsActive / programsTotal) * 100) : 0,
    },
    campaigns: {
      total: campaignsTotal,
      sent: campaignsSent,
      percentage: campaignsTotal > 0 ? Math.round((campaignsSent / campaignsTotal) * 100) : 0,
    },
  }
}

export const dynamic = 'force-dynamic'
