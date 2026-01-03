'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { useFinancialStore } from '@/app/stores/financialStore'
import { getPLReport } from '@/app/actions/financial-reports'
import { generatePLPDF } from '@/lib/pdf-export'
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency'

export default function PLReportPage() {
  const { plReport, plLoading, setPLReport, setPLLoading } = useFinancialStore()
  const [groupBy, setGroupBy] = useState<'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchPLReportData()
  }, [groupBy])

  const fetchPLReportData = async () => {
    setPLLoading(true)
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), 0, 1)

      const data = await getPLReport(
        startDate.toISOString().split('T')[0],
        now.toISOString().split('T')[0],
        groupBy
      )
      setPLReport(data)
    } catch (error) {
      console.error('Failed to fetch P&L report:', error)
      setPLReport(null, error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setPLLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (plReport) {
      generatePLPDF(plReport)
    }
  }

  if (plLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Loading P&L report...</p>
      </div>
    )
  }

  if (!plReport) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Failed to load P&L report</p>
      </div>
    )
  }

  const report = plReport
  const currency = report?.currency || 'GHS'

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Profit & Loss Report</h1>
              <p className="text-slate-400 mt-2 text-lg">Comprehensive income and expense analysis</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4 mr-2 text-slate-300" />
            <span className="text-slate-300">Export PDF</span>
          </Button>
        </div>

        {/* Group By Selector */}
        <div className="flex gap-2">
          <Button
            variant={groupBy === 'month' ? 'default' : 'outline'}
            onClick={() => setGroupBy('month')}
            className={groupBy === 'month' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : 'bg-white/10 border-white/20 hover:bg-white/20'}
          >
            Monthly
          </Button>
          <Button
            variant={groupBy === 'quarter' ? 'default' : 'outline'}
            onClick={() => setGroupBy('quarter')}
            className={groupBy === 'quarter' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : 'bg-white/10 border-white/20 hover:bg-white/20'}
          >
            Quarterly
          </Button>
          <Button
            variant={groupBy === 'year' ? 'default' : 'outline'}
            onClick={() => setGroupBy('year')}
            className={groupBy === 'year' ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-0' : 'bg-white/10 border-white/20 hover:bg-white/20'}
          >
            Yearly
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-white mb-2">{formatCurrencyCompact(report.revenue.total, currency)}</p>
              <p className="text-slate-500 text-xs">From invoices and contracts</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Expenses</p>
              <p className="text-4xl font-bold text-white mb-2">{formatCurrencyCompact(report.expenses.total, currency)}</p>
              <p className="text-slate-500 text-xs">Operating and direct costs</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Net Profit</p>
              <p className="text-4xl font-bold text-emerald-400 mb-2">{formatCurrencyCompact(report.profit.net, currency)}</p>
              <p className="text-slate-500 text-xs">{report.margins.net.toFixed(1)}% margin</p>
            </div>
          </div>
        </div>

        {/* P&L Statement Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Profit & Loss Statement</h2>
            <p className="text-slate-400 text-sm mb-6">Detailed breakdown of all revenue and expense items</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {/* Revenue Section */}
                  <tr className="bg-gradient-to-r from-blue-600/20 to-blue-600/10">
                    <td className="font-semibold text-white py-3 px-4">REVENUE</td>
                    <td className="text-right font-semibold text-white py-3 px-4"></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-slate-300">Invoice Revenue</td>
                    <td className="text-right py-3 px-4 text-slate-300">{formatCurrency(report.revenue.invoices, currency)}</td>
                  </tr>
                  <tr className="bg-gradient-to-r from-blue-600/20 to-blue-600/10 border-b border-white/10">
                    <td className="font-semibold text-white py-3 px-4">Total Revenue</td>
                    <td className="text-right font-semibold text-white py-3 px-4">
                      {formatCurrency(report.revenue.total, currency)}
                    </td>
                  </tr>

                  {/* Expenses Section */}
                  <tr className="bg-gradient-to-r from-red-600/20 to-red-600/10">
                    <td className="font-semibold text-white py-3 px-4">EXPENSES</td>
                    <td className="text-right font-semibold text-white py-3 px-4"></td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-4 text-slate-300">Total Expenses</td>
                    <td className="text-right py-3 px-4 text-slate-300">{formatCurrency(report.expenses.total || 0, currency)}</td>
                  </tr>
                  <tr className="bg-gradient-to-r from-red-600/20 to-red-600/10 border-b border-white/10">
                    <td className="font-semibold text-white py-3 px-4">Gross Profit</td>
                    <td className="text-right font-semibold text-white py-3 px-4">
                      {formatCurrency(report.profit.gross || 0, currency)}
                    </td>
                  </tr>

                  {/* Net Income */}
                  <tr className="bg-gradient-to-r from-emerald-600/20 to-emerald-600/10">
                    <td className="font-semibold text-white py-3 px-4 text-base">Net Income</td>
                    <td className="text-right font-semibold text-emerald-400 py-3 px-4 text-base">
                      {formatCurrency(report.profit.net || 0, currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Margin Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <p className="text-slate-400 text-sm font-medium mb-2">Gross Profit Margin</p>
              <p className="text-4xl font-bold text-white mb-3">{((report.margins?.gross) || 0).toFixed(1)}%</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min((report.margins?.gross) || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <p className="text-slate-400 text-sm font-medium mb-2">Operating Profit Margin</p>
              <p className="text-4xl font-bold text-white mb-3">{((report.margins?.operating) || 0).toFixed(1)}%</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min((report.margins?.operating) || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-2">Net Profit Margin</p>
              <p className="text-4xl font-bold text-emerald-400 mb-3">{((report.margins?.net) || 0).toFixed(1)}%</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                  style={{ width: `${Math.min((report.margins?.net) || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {report.breakdown.length > 0 && (
          <div className="space-y-6">
            {/* Profit Trend Chart */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-4">Profit Trend</h2>
                <p className="text-slate-400 text-sm mb-4">Monthly profit changes across the period</p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue vs Expenses Chart */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-4">Revenue vs Expenses</h2>
                <p className="text-slate-400 text-sm mb-4">Monthly comparison of revenue and expense trends</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                      labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
