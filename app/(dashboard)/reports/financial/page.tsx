'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ArrowUpRight, DollarSign, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useFinancialStore } from '@/app/stores/financialStore'
import { getFinancialSummary, getPLReport } from '@/app/actions/financial-reports'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const CustomPieTooltip = ({ active, payload }: any) => {
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

export default function FinancialReportsPage() {
  const { summary, summaryLoading, setSummary, setSummaryLoading } = useFinancialStore()
  const [dateRange, setDateRange] = useState('thisYear')
  const [chartData, setChartData] = useState<Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }> | null>(null)

  useEffect(() => {
    fetchFinancialData()
  }, [dateRange])

  const fetchFinancialData = async () => {
    setSummaryLoading(true)
    try {
      // Fetch financial summary from server action
      const summaryData = await getFinancialSummary()
      setSummary(summaryData)

      // Fetch P&L data for chart
      const now = new Date()
      let startDate = new Date()

      if (dateRange === 'thisYear') {
        startDate = new Date(now.getFullYear(), 0, 1)
      } else if (dateRange === 'lastMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      } else if (dateRange === 'lastQuarter') {
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3 - 3, 1)
      }

      const plData = await getPLReport(
        startDate.toISOString().split('T')[0],
        now.toISOString().split('T')[0],
        'month'
      )

      // Transform P&L breakdown to chart format
      const chartDataFormatted = plData.breakdown.map((item) => ({
        date: item.date,
        revenue: item.revenue,
        expenses: item.expenses,
        profit: item.profit,
      }))
      setChartData(chartDataFormatted)
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
      setSummary(null, error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setSummaryLoading(false)
    }
  }

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Loading financial reports...</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Failed to load financial data</p>
      </div>
    )
  }

  const revenueData = [
    { name: 'Invoices', value: summary.revenue.invoices },
  ]

  const paymentStatusData = [
    { name: 'Paid', value: summary.paymentStatus.paid, fill: '#10B981' },
    { name: 'Pending', value: summary.paymentStatus.pending, fill: '#F59E0B' },
    { name: 'Overdue', value: summary.paymentStatus.overdue, fill: '#EF4444' },
  ]

  return (
    <div className="min-h-screen space-y-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Financial Dashboard</h1>
            <p className="text-slate-400 mt-2 text-lg">Comprehensive financial analysis and insights</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={dateRange === 'thisYear' ? 'default' : 'outline'}
              onClick={() => setDateRange('thisYear')}
              className={dateRange === 'thisYear' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : ''}
            >
              This Year
            </Button>
            <Button
              variant={dateRange === 'lastQuarter' ? 'default' : 'outline'}
              onClick={() => setDateRange('lastQuarter')}
              className={dateRange === 'lastQuarter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : ''}
            >
              Last Quarter
            </Button>
            <Button
              variant={dateRange === 'lastMonth' ? 'default' : 'outline'}
              onClick={() => setDateRange('lastMonth')}
              className={dateRange === 'lastMonth' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : ''}
            >
              Last Month
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-3 rounded-xl border border-blue-400/30 backdrop-blur">
                  <DollarSign className="w-6 h-6 text-blue-300" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  {summary.metrics.revenueGrowth.toFixed(1)}%
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-white mb-2">
                ${(summary.revenue.total / 1000).toFixed(1)}K
              </p>
              <p className="text-slate-500 text-xs">
                {summary.metrics.invoiceCount} invoices
              </p>
            </div>
          </div>

          {/* Collection Rate Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
                  <TrendingUp className="w-6 h-6 text-emerald-300" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Collection Rate</p>
              <p className="text-4xl font-bold text-white mb-2">
                {summary.metrics.collectionRate.toFixed(1)}%
              </p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full"
                  style={{ width: `${summary.metrics.collectionRate}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">
                ${(summary.paymentStatus.paid / 1000).toFixed(1)}K collected
              </p>
            </div>
          </div>

          {/* Outstanding AR */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-orange-500/30 to-red-600/30 p-3 rounded-xl border border-orange-400/30 backdrop-blur">
                  <Clock className="w-6 h-6 text-orange-300" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Outstanding AR</p>
              <p className="text-4xl font-bold text-white mb-2">
                ${(summary.paymentStatus.pending / 1000).toFixed(1)}K
              </p>
              <p className="text-slate-500 text-xs">
                {summary.paymentStatus.overdue} overdue invoices
              </p>
            </div>
          </div>

          {/* Profit Margin Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-600/30 p-3 rounded-xl border border-purple-400/30 backdrop-blur">
                  <BarChart3 className="w-6 h-6 text-purple-300" />
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Profit Margin</p>
              <p className="text-4xl font-bold text-white mb-2">
                {summary.metrics.profitMargin.toFixed(1)}%
              </p>
              <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${Math.min(summary.metrics.profitMargin, 100)}%` }}
                />
              </div>
              <p className="text-slate-500 text-xs mt-2">
                ${(summary.profit.net / 1000).toFixed(1)}K net profit
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          {/* Revenue & Profit Trend */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-4">Revenue & Profit Trend</h2>
              <p className="text-slate-400 text-sm mb-4">Monthly revenue, expenses, and profit analysis</p>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-center py-8">No data available for selected period</p>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-4">Revenue by Source</h2>
                <p className="text-slate-400 text-sm mb-4">Invoice vs Contract revenue distribution</p>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Total Invoice Revenue</span>
                    <span className="font-semibold text-white">${(summary.revenue.invoices / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-4">Payment Status</h2>
                <p className="text-slate-400 text-sm mb-4">Distribution of paid, pending, and overdue amounts</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="#4F46E5">
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Report Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link href="/reports/financial/pl">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 h-full cursor-pointer">
                <h3 className="text-base font-bold text-white mb-1">Profit & Loss</h3>
                <p className="text-slate-400 text-sm mb-3">Detailed P&L analysis</p>
                <p className="text-2xl font-bold text-blue-400">${(summary.profit.net / 1000).toFixed(1)}K</p>
                <p className="text-xs text-slate-500 mt-1">Net Profit</p>
              </div>
            </div>
          </Link>

          <Link href="/reports/financial/revenue">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 h-full cursor-pointer">
                <h3 className="text-base font-bold text-white mb-1">Revenue Analysis</h3>
                <p className="text-slate-400 text-sm mb-3">By client & source</p>
                <p className="text-2xl font-bold text-emerald-400">${(summary.revenue.total / 1000).toFixed(1)}K</p>
                <p className="text-xs text-slate-500 mt-1">Total Revenue</p>
              </div>
            </div>
          </Link>

          <Link href="/reports/financial/invoices/aging">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 h-full cursor-pointer">
                <h3 className="text-base font-bold text-white mb-1">Invoice Aging</h3>
                <p className="text-slate-400 text-sm mb-3">AR analysis</p>
                <p className="text-2xl font-bold text-orange-400">{summary.paymentStatus.overdue}</p>
                <p className="text-xs text-slate-500 mt-1">Overdue Invoices</p>
              </div>
            </div>
          </Link>

          <Link href="/reports/financial/contracts">
            <div className="group relative h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 h-full cursor-pointer">
                <h3 className="text-base font-bold text-white mb-1">Contract Analysis</h3>
                <p className="text-slate-400 text-sm mb-3">Value & status</p>
                <p className="text-2xl font-bold text-purple-400">{summary.metrics.invoiceCount}</p>
                <p className="text-xs text-slate-500 mt-1">Invoices Created</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
