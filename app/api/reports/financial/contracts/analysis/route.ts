/**
 * Contract Analysis API Endpoint
 * GET /api/reports/financial/contracts/analysis
 * Returns contract value analysis and status breakdown
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

    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().getFullYear(), 0, 1)
    const endDate = endDateStr ? new Date(endDateStr) : new Date()

    // Fetch all contracts
    const contracts = await prisma.contract.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        client: true,
        invoices: true,
      },
    })

    // Fetch invoices to calculate revenue realization
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        issueDate: { gte: startDate, lte: endDate },
      },
      include: { payments: true },
    })

    // Categorize contracts by status
    const statusBreakdown = {
      draft: { count: 0, value: 0, contracts: [] as any[] },
      pending: { count: 0, value: 0, contracts: [] as any[] },
      active: { count: 0, value: 0, contracts: [] as any[] },
      expired: { count: 0, value: 0, contracts: [] as any[] },
      terminated: { count: 0, value: 0, contracts: [] as any[] },
    }

    let totalValue = 0
    const contractsList: Array<{
      id: string
      number: string
      client: string
      value: number
      status: string
      startDate: Date
      endDate: Date
      invoicedAmount: number
      remainingValue: number
      invoiceCount: number
    }> = []

    contracts.forEach((contract) => {
      const contractValue = Number(contract.value)
      const invoicedAmount = contract.invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
      const remainingValue = contractValue - invoicedAmount

      totalValue += contractValue

      const contractData = {
        id: contract.id,
        number: contract.contractNumber,
        client: contract.client?.name || 'Unknown',
        value: parseFloat(contractValue.toFixed(2)),
        status: contract.status,
        startDate: contract.startDate,
        endDate: contract.endDate,
        invoicedAmount: parseFloat(invoicedAmount.toFixed(2)),
        remainingValue: parseFloat(remainingValue.toFixed(2)),
        invoiceCount: contract.invoices.length,
      }

      contractsList.push(contractData)

      const status = contract.status.toLowerCase()
      if (status === 'draft') {
        statusBreakdown.draft.count += 1
        statusBreakdown.draft.value += contractValue
        statusBreakdown.draft.contracts.push(contractData)
      } else if (status === 'pending') {
        statusBreakdown.pending.count += 1
        statusBreakdown.pending.value += contractValue
        statusBreakdown.pending.contracts.push(contractData)
      } else if (status === 'active') {
        statusBreakdown.active.count += 1
        statusBreakdown.active.value += contractValue
        statusBreakdown.active.contracts.push(contractData)
      } else if (status === 'expired') {
        statusBreakdown.expired.count += 1
        statusBreakdown.expired.value += contractValue
        statusBreakdown.expired.contracts.push(contractData)
      } else if (status === 'terminated') {
        statusBreakdown.terminated.count += 1
        statusBreakdown.terminated.value += contractValue
        statusBreakdown.terminated.contracts.push(contractData)
      }
    })

    // Calculate realization rates
    const activeContracts = statusBreakdown.active.contracts
    const activeValue = statusBreakdown.active.value
    const activeInvoiced = activeContracts.reduce((sum, c) => sum + c.invoicedAmount, 0)
    const realizationRate = activeValue > 0 ? (activeInvoiced / activeValue) * 100 : 0

    // Top clients by contract value
    const clientContractMap: Record<string, { name: string; totalValue: number; contractCount: number }> = {}
    contractsList.forEach((contract) => {
      if (!clientContractMap[contract.client]) {
        clientContractMap[contract.client] = { name: contract.client, totalValue: 0, contractCount: 0 }
      }
      clientContractMap[contract.client].totalValue += contract.value
      clientContractMap[contract.client].contractCount += 1
    })

    const topClients = Object.values(clientContractMap)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5)
      .map((client) => ({
        name: client.name,
        contractValue: parseFloat(client.totalValue.toFixed(2)),
        contractCount: client.contractCount,
        percentOfTotal: parseFloat(((client.totalValue / totalValue) * 100).toFixed(2)),
      }))

    const report = {
      period: { startDate, endDate },
      summary: {
        totalContracts: contracts.length,
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalInvoiced: parseFloat(activeInvoiced.toFixed(2)),
        remainingValue: parseFloat((activeValue - activeInvoiced).toFixed(2)),
        realizationRate: parseFloat(realizationRate.toFixed(2)),
        averageContractValue: contracts.length > 0 ? parseFloat((totalValue / contracts.length).toFixed(2)) : 0,
      },
      statusBreakdown: {
        draft: {
          count: statusBreakdown.draft.count,
          value: parseFloat(statusBreakdown.draft.value.toFixed(2)),
          percentage: totalValue > 0 ? parseFloat(((statusBreakdown.draft.value / totalValue) * 100).toFixed(2)) : 0,
        },
        pending: {
          count: statusBreakdown.pending.count,
          value: parseFloat(statusBreakdown.pending.value.toFixed(2)),
          percentage: totalValue > 0 ? parseFloat(((statusBreakdown.pending.value / totalValue) * 100).toFixed(2)) : 0,
        },
        active: {
          count: statusBreakdown.active.count,
          value: parseFloat(statusBreakdown.active.value.toFixed(2)),
          percentage: totalValue > 0 ? parseFloat(((statusBreakdown.active.value / totalValue) * 100).toFixed(2)) : 0,
        },
        expired: {
          count: statusBreakdown.expired.count,
          value: parseFloat(statusBreakdown.expired.value.toFixed(2)),
          percentage: totalValue > 0 ? parseFloat(((statusBreakdown.expired.value / totalValue) * 100).toFixed(2)) : 0,
        },
        terminated: {
          count: statusBreakdown.terminated.count,
          value: parseFloat(statusBreakdown.terminated.value.toFixed(2)),
          percentage: totalValue > 0 ? parseFloat(((statusBreakdown.terminated.value / totalValue) * 100).toFixed(2)) : 0,
        },
      },
      topClients,
      contracts: contractsList.sort((a, b) => b.value - a.value),
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Contract analysis report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
