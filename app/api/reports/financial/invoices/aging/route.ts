/**
 * Invoice Aging Report API Endpoint
 * GET /api/reports/financial/invoices/aging
 * Returns invoice aging analysis
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
    const asOfDateStr = searchParams.get('date')
    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date()

    // Fetch all outstanding invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        status: { in: ['SENT', 'OVERDUE', 'PAID'] },
      },
      include: { client: true, payments: true },
    })

    // Calculate aging buckets
    const buckets = {
      current: { count: 0, amount: 0, invoices: [] as any[] },
      days30: { count: 0, amount: 0, invoices: [] as any[] },
      days60: { count: 0, amount: 0, invoices: [] as any[] },
      days90: { count: 0, amount: 0, invoices: [] as any[] },
      over90: { count: 0, amount: 0, invoices: [] as any[] },
    }

    let totalAmount = 0
    let totalOutstanding = 0

    invoices.forEach((invoice) => {
      // Calculate outstanding balance
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const outstanding = Number(invoice.totalAmount) - totalPaid

      // Only include outstanding invoices
      if (outstanding > 0) {
        totalAmount += Number(invoice.totalAmount)
        totalOutstanding += outstanding

        const daysOverdue = Math.floor((asOfDate.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))

        const invoiceData = {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.client?.name || 'Unknown',
          clientEmail: invoice.client?.email,
          amount: parseFloat(Number(invoice.totalAmount).toFixed(2)),
          outstanding: parseFloat(outstanding.toFixed(2)),
          daysOverdue: Math.max(0, daysOverdue),
          dueDate: invoice.dueDate,
          status: invoice.status,
        }

        if (daysOverdue < 0) {
          buckets.current.invoices.push(invoiceData)
          buckets.current.amount += outstanding
          buckets.current.count += 1
        } else if (daysOverdue <= 30) {
          buckets.days30.invoices.push(invoiceData)
          buckets.days30.amount += outstanding
          buckets.days30.count += 1
        } else if (daysOverdue <= 60) {
          buckets.days60.invoices.push(invoiceData)
          buckets.days60.amount += outstanding
          buckets.days60.count += 1
        } else if (daysOverdue <= 90) {
          buckets.days90.invoices.push(invoiceData)
          buckets.days90.amount += outstanding
          buckets.days90.count += 1
        } else {
          buckets.over90.invoices.push(invoiceData)
          buckets.over90.amount += outstanding
          buckets.over90.count += 1
        }
      }
    })

    // Calculate DSO (Days Sales Outstanding)
    const avgDailyRevenue = totalAmount / Math.max(1, Math.ceil((asOfDate.getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)))
    const dso = avgDailyRevenue > 0 ? Math.round(totalOutstanding / avgDailyRevenue) : 0

    const report = {
      asOfDate,
      current: {
        label: 'Not Yet Due',
        count: buckets.current.count,
        amount: parseFloat(buckets.current.amount.toFixed(2)),
        percentage: totalOutstanding > 0 ? parseFloat(((buckets.current.amount / totalOutstanding) * 100).toFixed(2)) : 0,
        invoices: buckets.current.invoices,
      },
      days30: {
        label: '1-30 Days Overdue',
        count: buckets.days30.count,
        amount: parseFloat(buckets.days30.amount.toFixed(2)),
        percentage: totalOutstanding > 0 ? parseFloat(((buckets.days30.amount / totalOutstanding) * 100).toFixed(2)) : 0,
        invoices: buckets.days30.invoices,
      },
      days60: {
        label: '31-60 Days Overdue',
        count: buckets.days60.count,
        amount: parseFloat(buckets.days60.amount.toFixed(2)),
        percentage: totalOutstanding > 0 ? parseFloat(((buckets.days60.amount / totalOutstanding) * 100).toFixed(2)) : 0,
        invoices: buckets.days60.invoices,
      },
      days90: {
        label: '61-90 Days Overdue',
        count: buckets.days90.count,
        amount: parseFloat(buckets.days90.amount.toFixed(2)),
        percentage: totalOutstanding > 0 ? parseFloat(((buckets.days90.amount / totalOutstanding) * 100).toFixed(2)) : 0,
        invoices: buckets.days90.invoices,
      },
      over90: {
        label: '90+ Days Overdue',
        count: buckets.over90.count,
        amount: parseFloat(buckets.over90.amount.toFixed(2)),
        percentage: totalOutstanding > 0 ? parseFloat(((buckets.over90.amount / totalOutstanding) * 100).toFixed(2)) : 0,
        invoices: buckets.over90.invoices,
      },
      total: {
        count: invoices.filter((inv) => {
          const totalPaid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
          return Number(inv.totalAmount) - totalPaid > 0
        }).length,
        amount: parseFloat(totalOutstanding.toFixed(2)),
      },
      metrics: {
        dso,
        avgDaysOverdue: dso > 0 ? dso : 0,
        highestRisk: buckets.over90.amount,
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Invoice aging report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
