'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'

interface ContractAnalysis {
  period: { startDate: string; endDate: string }
  summary: {
    totalContracts: number
    totalValue: number
    totalInvoiced: number
    remainingValue: number
    realizationRate: number
    averageContractValue: number
  }
  statusBreakdown: {
    draft: { count: number; value: number; percentage: number }
    pending: { count: number; value: number; percentage: number }
    active: { count: number; value: number; percentage: number }
    expired: { count: number; value: number; percentage: number }
    terminated: { count: number; value: number; percentage: number }
  }
  topClients: Array<{
    name: string
    contractValue: number
    contractCount: number
    percentOfTotal: number
  }>
  contracts: Array<{
    id: string
    number: string
    client: string
    value: number
    status: string
    startDate: string
    endDate: string
    invoicedAmount: number
    remainingValue: number
    invoiceCount: number
  }>
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9CA3AF',
  PENDING: '#F59E0B',
  ACTIVE: '#10B981',
  EXPIRED: '#EF4444',
  TERMINATED: '#6B7280',
}

const CustomContractTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
      }}>
        <p style={{ color: '#ffffff', fontWeight: '500', margin: '0 0 4px 0' }}>
          {payload[0].name}
        </p>
        <p style={{ color: '#ffffff', margin: 0 }}>
          ${payload[0].value?.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export default function ContractAnalysisPage() {
  return (
    <FeatureGuard
      feature={Feature.REPORT_CONTRACTS}
      featureDescription="Access contract performance and analysis"
    >
      <ContractAnalysisContent />
    </FeatureGuard>
  )
}

function ContractAnalysisContent() {
  const [report, setReport] = useState<ContractAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContractAnalysis()
  }, [])

  const fetchContractAnalysis = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), 0, 1)

      const response = await fetch(
        `/api/reports/financial/contracts/analysis?startDate=${startDate.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`
      )
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch contract analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Loading contract analysis...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Failed to load contract analysis</p>
      </div>
    )
  }

  const statusData = [
    { name: 'Draft', value: report.statusBreakdown.draft.value, fill: STATUS_COLORS.DRAFT },
    { name: 'Pending', value: report.statusBreakdown.pending.value, fill: STATUS_COLORS.PENDING },
    { name: 'Active', value: report.statusBreakdown.active.value, fill: STATUS_COLORS.ACTIVE },
    { name: 'Expired', value: report.statusBreakdown.expired.value, fill: STATUS_COLORS.EXPIRED },
    { name: 'Terminated', value: report.statusBreakdown.terminated.value, fill: STATUS_COLORS.TERMINATED },
  ].filter((item) => item.value > 0)

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <Link href="/reports/financial">
              <Button variant="outline" size="icon" className="bg-white/10 border-white/20 hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 text-slate-300" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Contract Analysis</h1>
              <p className="text-slate-400 mt-2 text-lg">Contract value, status, and realization tracking</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">
            <Download className="h-4 w-4 mr-2 text-slate-300" />
            <span className="text-slate-300">Export PDF</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Contracts</p>
              <p className="text-4xl font-bold text-white mb-2">{report.summary.totalContracts}</p>
              <p className="text-slate-500 text-xs">All statuses</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Value</p>
              <p className="text-4xl font-bold text-white mb-2">${(report.summary.totalValue / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">Contract pipeline</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Realization Rate</p>
              <p className="text-4xl font-bold text-white mb-2">{report.summary.realizationRate.toFixed(1)}%</p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                  style={{ width: `${report.summary.realizationRate}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">Invoiced vs contracted</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Avg Contract Value</p>
              <p className="text-4xl font-bold text-white mb-2">${(report.summary.averageContractValue / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">Per contract</p>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {[
            { status: 'DRAFT', label: 'Draft', data: report.statusBreakdown.draft },
            { status: 'PENDING', label: 'Pending', data: report.statusBreakdown.pending },
            { status: 'ACTIVE', label: 'Active', data: report.statusBreakdown.active },
            { status: 'EXPIRED', label: 'Expired', data: report.statusBreakdown.expired },
            { status: 'TERMINATED', label: 'Terminated', data: report.statusBreakdown.terminated },
          ].map((item) => (
            <div key={item.status} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] }}
                  />
                  <p className="text-sm font-medium text-white">{item.label}</p>
                </div>
                <p className="text-2xl font-bold text-white">{item.data.count}</p>
                <p className="text-xs text-slate-500 mt-1">
                  ${(item.data.value / 1000).toFixed(1)}K • {item.data.percentage.toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Status and Realization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Chart */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Contract Value by Status</h2>
              <p className="text-slate-400 text-sm mb-4">Distribution of contract values across different statuses</p>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomContractTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Realization Chart */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Revenue Realization</h2>
              <p className="text-slate-400 text-sm mb-4">Invoiced amount vs remaining contract value</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Contract Value Realization',
                      invoiced: report.summary.totalInvoiced,
                      remaining: report.summary.remainingValue,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="invoiced" stackId="a" fill="#10B981" name="Invoiced" />
                  <Bar dataKey="remaining" stackId="a" fill="rgba(255,255,255,0.1)" name="Remaining" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Total Value</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    ${(report.summary.totalValue / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Invoiced</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ${(report.summary.totalInvoiced / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="text-2xl font-bold text-orange-400 mt-1">
                    ${(report.summary.remainingValue / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Clients Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Top Clients by Contract Value</h2>
            <p className="text-slate-400 text-sm mb-4">Ranking of clients by total contract value</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Client Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Contract Value</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Contracts</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topClients.map((client, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-300">{client.name}</td>
                      <td className="text-right py-3 px-4 font-semibold text-white">
                        ${client.contractValue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-300">{client.contractCount}</td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                          {client.percentOfTotal.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* All Contracts Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">All Contracts</h2>
            <p className="text-slate-400 text-sm mb-4">Complete list of all contracts with realization metrics</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Contract #</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Client</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Value</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Invoiced</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Remaining</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Invoices</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {report.contracts.map((contract, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium text-white">{contract.number}</td>
                      <td className="py-3 px-4 text-slate-300">{contract.client}</td>
                      <td className="text-right py-3 px-4 font-semibold text-white">
                        ${contract.value.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-emerald-400 font-semibold">
                        ${contract.invoicedAmount.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-400 font-semibold">
                        ${contract.remainingValue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-300">{contract.invoiceCount}</td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-semibold text-white"
                          style={{ backgroundColor: STATUS_COLORS[contract.status] }}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(contract.startDate).toLocaleDateString()} -{' '}
                        {new Date(contract.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
