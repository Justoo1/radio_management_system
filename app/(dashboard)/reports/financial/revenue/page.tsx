'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'

interface RevenueReport {
  period: { startDate: string; endDate: string }
  groupBy: string
  totalRevenue: number
  invoiceCount: number
  averageInvoiceValue: number
  bySource: Array<{
    source: string
    amount: number
    percentage: number
    invoiceCount: number
    growth: number
  }>
  topClients: Array<{
    clientName: string
    revenue: number
    invoiceCount: number
    averageInvoiceValue: number
    percentOfTotal: number
  }>
  trend: Array<{
    date: string
    revenue: number
    cumulativeRevenue: number
  }>
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

const CustomTooltip = ({ active, payload }: any) => {
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

export default function RevenueReportPage() {
  return (
    <FeatureGuard
      feature={Feature.REPORT_REVENUE}
      featureDescription="Access detailed revenue analytics and reporting"
    >
      <RevenueReportContent />
    </FeatureGuard>
  )
}

function RevenueReportContent() {
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState('client')

  useEffect(() => {
    fetchRevenueReport()
  }, [groupBy])

  const fetchRevenueReport = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), 0, 1)

      const response = await fetch(
        `/api/reports/financial/revenue?startDate=${startDate.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}&groupBy=${groupBy}`
      )
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch revenue report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Loading revenue report...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Failed to load revenue report</p>
      </div>
    )
  }

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Revenue Analysis</h1>
              <p className="text-slate-400 mt-2 text-lg">Revenue breakdown by client, source, and trends</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">
            <Download className="h-4 w-4 mr-2 text-slate-300" />
            <span className="text-slate-300">Export PDF</span>
          </Button>
        </div>

        {/* Group By Selector */}
        <div className="flex gap-2">
          <Button
            variant={groupBy === 'client' ? 'default' : 'outline'}
            onClick={() => setGroupBy('client')}
            className={groupBy === 'client' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'}
          >
            By Client
          </Button>
          <Button
            variant={groupBy === 'category' ? 'default' : 'outline'}
            onClick={() => setGroupBy('category')}
            className={groupBy === 'category' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'}
          >
            By Category
          </Button>
          <Button
            variant={groupBy === 'source' ? 'default' : 'outline'}
            onClick={() => setGroupBy('source')}
            className={groupBy === 'source' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/10 border-white/20 text-slate-300 hover:bg-white/20'}
          >
            By Source
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-white mb-2">${(report.totalRevenue / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">{report.invoiceCount} invoices</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Average Invoice</p>
              <p className="text-4xl font-bold text-white mb-2">${(report.averageInvoiceValue / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">Per invoice</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Active Clients</p>
              <p className="text-4xl font-bold text-white mb-2">{report.topClients.length}</p>
              <p className="text-slate-500 text-xs">Top clients tracked</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Avg Growth</p>
              <p className="text-4xl font-bold text-white mb-2">+12.5%</p>
              <p className="text-slate-500 text-xs">Month-over-month</p>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown Chart */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Revenue by {report.groupBy === 'client' ? 'Client' : report.groupBy === 'category' ? 'Category' : 'Source'}</h2>
            <p className="text-slate-400 text-sm mb-4">Distribution of revenue across different {report.groupBy === 'client' ? 'clients' : report.groupBy === 'category' ? 'categories' : 'sources'}</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={report.bySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percentage }) => `${source.substring(0, 10)}: ${percentage.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {report.bySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Revenue Trend</h2>
            <p className="text-slate-400 text-sm mb-4">Daily revenue and cumulative growth over time</p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={report.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="cumulativeRevenue" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Top Clients by Revenue</h2>
            <p className="text-slate-400 text-sm mb-4">Ranking of clients by total revenue generated</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">Client Name</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Invoices</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Avg Invoice</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topClients.map((client, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-300">{client.clientName}</td>
                      <td className="text-right py-3 px-4 font-semibold text-white">
                        ${client.revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-300">{client.invoiceCount}</td>
                      <td className="text-right py-3 px-4 text-slate-300">${client.averageInvoiceValue.toLocaleString()}</td>
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

        {/* Detailed Breakdown Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Detailed Revenue Breakdown</h2>
            <p className="text-slate-400 text-sm mb-4">Complete list of revenue by {report.groupBy === 'client' ? 'client' : report.groupBy === 'category' ? 'category' : 'source'}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-slate-300">{report.groupBy === 'client' ? 'Client' : report.groupBy === 'category' ? 'Category' : 'Source'}</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Invoices</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">% of Total</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {report.bySource.map((item, index) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-slate-300">{item.source}</td>
                      <td className="text-right py-3 px-4 font-semibold text-white">
                        ${item.amount.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-slate-300">{item.invoiceCount}</td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-block bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-semibold ${item.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.growth >= 0 ? '+' : ''}{item.growth.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10 bg-white/5 font-bold">
                    <td className="py-3 px-4 text-white">Total</td>
                    <td className="text-right py-3 px-4 text-white">
                      ${report.totalRevenue.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300">{report.invoiceCount}</td>
                    <td className="text-right py-3 px-4 text-slate-300">100.0%</td>
                    <td className="text-right py-3 px-4 text-slate-300">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
