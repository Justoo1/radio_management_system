/**
 * Client Analytics Report API
 * Returns detailed analytics for clients
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Feature, checkFeatureAccess } from '@/lib/features'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organizationId = user.organizationId

    // Check client analytics report feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.REPORT_CLIENT_ANALYTICS)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Client analytics report is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    // Get client metrics
    const clients = await prisma.client.findMany({
      where: { organizationId },
      include: {
        contracts: {
          select: {
            value: true,
            status: true,
          },
        },
        invoices: {
          select: {
            totalAmount: true,
            status: true,
          },
        },
        adCampaigns: {
          select: {
            id: true,
          },
        },
      },
    })

    // Calculate metrics
    const totalClients = clients.length
    const activeClients = clients.filter((c) => c.status === 'ACTIVE').length
    const prospectClients = clients.filter((c) => c.status === 'PROSPECT').length
    const inactiveClients = clients.filter((c) => c.status === 'INACTIVE').length

    // Calculate retention rate
    const activePercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0
    const clientRetention = parseFloat(activePercentage.toFixed(1))

    // Calculate average client value (from contracts)
    const totalContractValue = clients.reduce((sum, client) => {
      const clientValue = client.contracts.reduce(
        (contractSum, contract) => contractSum + Number(contract.value || 0),
        0
      )
      return sum + clientValue
    }, 0)
    const averageClientValue = totalClients > 0 ? Math.round(totalContractValue / totalClients) : 0

    // Get client growth data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const clientsWithDates = await prisma.client.findMany({
      where: {
        organizationId,
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by month
    const monthlyData: Record<string, { newClients: number; activeClients: number; revenue: number }> = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = monthNames[date.getMonth()]
      monthlyData[monthKey] = { newClients: 0, activeClients: 0, revenue: 0 }
    }

    // Calculate monthly new clients
    clientsWithDates.forEach((client) => {
      const monthKey = monthNames[client.createdAt.getMonth()]
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].newClients++
      }
    })

    // Calculate cumulative active clients
    let cumulativeActive = activeClients
    Object.keys(monthlyData)
      .reverse()
      .forEach((month) => {
        monthlyData[month].activeClients = cumulativeActive
        cumulativeActive = Math.max(0, cumulativeActive - monthlyData[month].newClients)
      })

    // Get revenue data from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: { gte: sixMonthsAgo },
        status: 'PAID',
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    })

    invoices.forEach((invoice) => {
      const monthKey = monthNames[invoice.createdAt.getMonth()]
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += Number(invoice.totalAmount)
      }
    })

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      newClients: data.newClients,
      activeClients: data.activeClients,
      revenue: data.revenue,
    }))

    // Calculate monthly growth
    const currentMonthClients = chartData[chartData.length - 1]?.newClients || 0
    const previousMonthClients = chartData[chartData.length - 2]?.newClients || 1
    const monthlyGrowth =
      previousMonthClients > 0
        ? parseFloat((((currentMonthClients - previousMonthClients) / previousMonthClients) * 100).toFixed(1))
        : 0

    // Get top clients by revenue
    const topClients = clients
      .map((client) => {
        const revenue = client.invoices
          .filter((inv) => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
        const campaigns = client.adCampaigns.length
        return {
          name: client.name,
          status: client.status,
          campaigns,
          revenue,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Status breakdown
    const statusBreakdown = [
      {
        status: 'ACTIVE',
        count: activeClients,
        percentage: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
        color: 'bg-emerald-500/30 text-emerald-300',
      },
      {
        status: 'PROSPECT',
        count: prospectClients,
        percentage: totalClients > 0 ? Math.round((prospectClients / totalClients) * 100) : 0,
        color: 'bg-amber-500/30 text-amber-300',
      },
      {
        status: 'INACTIVE',
        count: inactiveClients,
        percentage: totalClients > 0 ? Math.round((inactiveClients / totalClients) * 100) : 0,
        color: 'bg-slate-500/30 text-slate-300',
      },
    ]

    return NextResponse.json({
      metrics: {
        totalClients,
        activeClients,
        prospectClients,
        inactiveClients,
        clientRetention,
        averageClientValue,
        monthlyGrowth,
      },
      chartData,
      topClients,
      statusBreakdown,
    })
  } catch (error) {
    console.error('Error fetching client analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
