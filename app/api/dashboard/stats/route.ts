/**
 * Dashboard Quick Stats API
 * Fetches quick statistics for the reports overview page
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

    const organizationId = user.organizationId

    // Fetch all stats in parallel
    const [
      totalRevenue,
      totalClients,
      activePrograms,
      smsCampaigns
    ] = await Promise.all([
      // Total revenue from PAID invoices
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: 'PAID'
        },
        _sum: {
          totalAmount: true
        }
      }),
      // Total clients
      prisma.client.count({
        where: { organizationId }
      }),
      // Active programs
      prisma.program.count({
        where: {
          organizationId,
          isActive: true
        }
      }),
      // Total SMS campaigns
      prisma.sMSCampaign.count({
        where: { organizationId }
      })
    ])

    return NextResponse.json({
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      totalClients,
      activePrograms,
      smsCampaigns,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
