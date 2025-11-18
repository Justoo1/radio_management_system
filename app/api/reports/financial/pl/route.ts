/**
 * Profit & Loss Report API Endpoint
 * GET /api/reports/financial/pl
 * Returns comprehensive P&L report with revenue, expenses, and profit margins
 */

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const groupBy = (searchParams.get('groupBy') || 'month') as 'month' | 'quarter' | 'year'

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    // Fetch invoices for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        issueDate: { gte: startDate, lte: endDate },
        status: { in: ['PAID', 'SENT', 'OVERDUE'] }, // Include invoices that are paid or waiting
      },
      include: { payments: true },
    })

    // Calculate revenues - ONLY COUNT INVOICES
    // Contracts are NOT counted until invoices are created from them
    const invoiceRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)

    // Revenue breakdown - ONLY INVOICES
    const revenue = {
      invoices: invoiceRevenue,
      services: 0, // TODO: Implement service revenue tracking
      other: 0,
      total: invoiceRevenue,
    }

    // Expenses breakdown (placeholder - implement when expense tracking is added)
    const expenses = {
      cogs: 0,
      salary: 0,
      rent: 0,
      utilities: 0,
      marketing: 0,
      equipment: 0,
      software: 0,
      other: 0,
      total: 0,
    }

    // Profit calculations
    const grossProfit = revenue.total - expenses.cogs
    const operatingProfit = grossProfit - (expenses.total - expenses.cogs)
    const netProfit = operatingProfit

    // Margin calculations
    const grossMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0
    const operatingMargin = revenue.total > 0 ? (operatingProfit / revenue.total) * 100 : 0
    const netMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0

    // Group data by period if needed
    const breakdown = groupByPeriod(invoices, groupBy, startDate, endDate)

    const report = {
      period: { startDate, endDate },
      groupBy,
      revenue,
      expenses,
      profit: {
        gross: parseFloat(grossProfit.toFixed(2)),
        operating: parseFloat(operatingProfit.toFixed(2)),
        net: parseFloat(netProfit.toFixed(2)),
      },
      margins: {
        gross: parseFloat(grossMargin.toFixed(2)),
        operating: parseFloat(operatingMargin.toFixed(2)),
        net: parseFloat(netMargin.toFixed(2)),
      },
      breakdown,
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('P&L report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function groupByPeriod(invoices: any[], groupBy: 'month' | 'quarter' | 'year', startDate: Date, endDate: Date) {
  const groups: Record<string, { date: string; revenue: number; expenses: number; profit: number }> = {}

  invoices.forEach((invoice) => {
    const invoiceDate = new Date(invoice.issueDate)
    let key = ''

    if (groupBy === 'month') {
      key = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`
    } else if (groupBy === 'quarter') {
      const quarter = Math.ceil((invoiceDate.getMonth() + 1) / 3)
      key = `${invoiceDate.getFullYear()}-Q${quarter}`
    } else {
      key = invoiceDate.getFullYear().toString()
    }

    if (!groups[key]) {
      groups[key] = { date: key, revenue: 0, expenses: 0, profit: 0 }
    }

    groups[key].revenue += Number(invoice.totalAmount)
    groups[key].profit = groups[key].revenue - groups[key].expenses
  })

  return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date))
}
