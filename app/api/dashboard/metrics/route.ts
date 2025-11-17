/**
 * Dashboard Metrics API
 * Fetches growth rate and other metrics
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json(
        { error: 'User or organization not found' },
        { status: 404 }
      )
    }

    // Get current counts
    const [clientsTotal, clientsActive, programsTotal, programsActive, campaignsTotal, campaignsSent] = await Promise.all([
      prisma.client.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.client.count({
        where: { organizationId: user.organizationId, status: 'ACTIVE' }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.program.count({
        where: { organizationId: user.organizationId, isActive: true }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId }
      }),
      prisma.sMSCampaign.count({
        where: { organizationId: user.organizationId, status: 'SENT' }
      })
    ])

    // Calculate growth rate (compare with previous month)
    const today = new Date()
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, today.getDate())

    // Get client counts from last month
    const clientsLastMonth = await prisma.client.count({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          lte: oneMonthAgo
        }
      }
    })

    const clientsTwoMonthsAgo = await prisma.client.count({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          lte: twoMonthsAgo
        }
      }
    })

    // Calculate growth percentage
    let growthRate = 0
    let growthTrend = 0

    if (clientsLastMonth > 0) {
      growthRate = ((clientsTotal - clientsLastMonth) / clientsLastMonth) * 100
    }

    if (clientsTwoMonthsAgo > 0) {
      growthTrend = ((clientsLastMonth - clientsTwoMonthsAgo) / clientsTwoMonthsAgo) * 100
    }

    // Format metrics
    const metrics = {
      growthRate: {
        value: Math.round(growthRate * 10) / 10, // Round to 1 decimal
        label: 'Growth Rate',
        unit: '%',
        trend: Math.round(growthTrend * 10) / 10,
        description: `${growthRate > 0 ? '+' : ''}${Math.round(growthRate)}% from last month`
      },
      clients: {
        total: clientsTotal,
        active: clientsActive,
        percentage: clientsTotal > 0 ? Math.round((clientsActive / clientsTotal) * 100) : 0
      },
      programs: {
        total: programsTotal,
        active: programsActive,
        percentage: programsTotal > 0 ? Math.round((programsActive / programsTotal) * 100) : 0
      },
      campaigns: {
        total: campaignsTotal,
        sent: campaignsSent,
        percentage: campaignsTotal > 0 ? Math.round((campaignsSent / campaignsTotal) * 100) : 0
      }
    }

    return NextResponse.json({
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
