/**
 * Financial Summary API Endpoint
 * GET /api/reports/financial/summary
 * Returns a comprehensive financial overview for a date range
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

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { organization: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        issueDate: { gte: startDate, lte: endDate },
      },
      include: { payments: true },
    })

    // Calculate metrics - ONLY COUNT INVOICES AS REVENUE
    // Contracts are NOT counted until invoices are created from them
    const totalInvoices = invoices.length
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const totalPaid = invoices.reduce((sum, inv) => {
      const paidAmount = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      return sum + paidAmount
    }, 0)
    const totalOutstanding = totalInvoiceAmount - totalPaid
    const overdueCount = invoices.filter(
      (inv) => inv.status === 'OVERDUE' && new Date(inv.dueDate) < new Date()
    ).length

    const collectionRate = totalInvoiceAmount > 0 ? (totalPaid / totalInvoiceAmount) * 100 : 0

    // Calculate growth (compare with previous period)
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = new Date(startDate.getTime() - 1)

    const previousInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        issueDate: { gte: previousPeriodStart, lte: previousPeriodEnd },
      },
      include: { payments: true },
    })

    const previousTotal = previousInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
    const revenueGrowth = previousTotal > 0 ? ((totalInvoiceAmount - previousTotal) / previousTotal) * 100 : 0

    const summary = {
      period: { startDate, endDate },
      revenue: {
        invoices: totalInvoiceAmount,
        total: totalInvoiceAmount,
      },
      expenses: {
        total: 0, // TODO: Implement expense tracking
      },
      profit: {
        gross: totalInvoiceAmount,
        net: totalInvoiceAmount,
      },
      paymentStatus: {
        paid: totalPaid,
        pending: totalOutstanding,
        overdue: overdueCount,
      },
      metrics: {
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
        collectionRate: parseFloat(collectionRate.toFixed(2)),
        profitMargin: 100, // 100% until expenses are tracked
        invoiceCount: totalInvoices,
        averageInvoiceValue: totalInvoices > 0 ? parseFloat((totalInvoiceAmount / totalInvoices).toFixed(2)) : 0,
        daysSalesOutstanding: totalInvoiceAmount > 0
          ? parseFloat(((totalOutstanding / totalInvoiceAmount) * periodDays).toFixed(2))
          : 0,
      },
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Financial summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
