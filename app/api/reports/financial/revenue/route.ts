/**
 * Revenue Analysis API Endpoint
 * GET /api/reports/financial/revenue
 * Returns revenue breakdown by client, source, and trends
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Feature, checkFeatureAccess } from '@/lib/features'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Check revenue report feature access
    const { hasAccess } = await checkFeatureAccess(prisma, user.organizationId, Feature.REPORT_REVENUE)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Revenue report is not enabled for your organization. Please upgrade your plan.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'client'

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    // Fetch invoices with client info
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        issueDate: { gte: startDate, lte: endDate },
      },
      include: { client: true, payments: true },
    })

    // Calculate total revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    // Revenue by source/dimension
    let bySource: Array<{
      source: string
      amount: number
      percentage: number
      invoiceCount: number
      growth: number
    }> = []

    if (groupBy === 'client') {
      const byClient: Record<
        string,
        { id: string; name: string; amount: number; count: number }
      > = {}

      invoices.forEach((invoice) => {
        const clientKey = invoice.client?.id || 'unknown'
        if (!byClient[clientKey]) {
          byClient[clientKey] = {
            id: invoice.client?.id || 'unknown',
            name: invoice.client?.name || 'Unknown Client',
            amount: 0,
            count: 0,
          }
        }
        byClient[clientKey].amount += Number(invoice.totalAmount)
        byClient[clientKey].count += 1
      })

      bySource = Object.values(byClient)
        .map((client) => ({
          source: client.name,
          amount: parseFloat(client.amount.toFixed(2)),
          percentage: parseFloat(((client.amount / totalRevenue) * 100).toFixed(2)),
          invoiceCount: client.count,
          growth: 0, // TODO: Calculate growth vs previous period
        }))
        .sort((a, b) => b.amount - a.amount)
    } else if (groupBy === 'contract') {
      // TODO: Implement contract revenue grouping
    }

    // Top clients
    const topClients = bySource.slice(0, 5).map((source) => ({
      clientName: source.source,
      revenue: source.amount,
      invoiceCount: source.invoiceCount,
      averageInvoiceValue: parseFloat((source.amount / source.invoiceCount).toFixed(2)),
      percentOfTotal: source.percentage,
    }))

    // Revenue trend (daily aggregation)
    const trend: Array<{ date: string; revenue: number; cumulativeRevenue: number }> = []
    const dailyRevenue: Record<string, number> = {}

    invoices.forEach((invoice) => {
      const dateKey = invoice.issueDate.toISOString().split('T')[0]
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + Number(invoice.totalAmount)
    })

    let cumulativeRevenue = 0
    Object.keys(dailyRevenue)
      .sort()
      .forEach((date) => {
        cumulativeRevenue += dailyRevenue[date]
        trend.push({
          date,
          revenue: parseFloat(dailyRevenue[date].toFixed(2)),
          cumulativeRevenue: parseFloat(cumulativeRevenue.toFixed(2)),
        })
      })

    const report = {
      period: { startDate, endDate },
      groupBy,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      invoiceCount: invoices.length,
      averageInvoiceValue: invoices.length > 0 ? parseFloat((totalRevenue / invoices.length).toFixed(2)) : 0,
      bySource,
      topClients,
      trend,
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Revenue report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
