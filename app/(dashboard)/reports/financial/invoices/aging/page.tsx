'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Download, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface AgingBucket {
  label: string
  count: number
  amount: number
  percentage: number
  invoices: Array<{
    invoiceNumber: string
    clientName: string
    clientEmail?: string
    amount: number
    outstanding: number
    daysOverdue: number
    dueDate: string
    status: string
  }>
}

interface AgingReport {
  asOfDate: string
  current: AgingBucket
  days30: AgingBucket
  days60: AgingBucket
  days90: AgingBucket
  over90: AgingBucket
  total: { count: number; amount: number }
  metrics: {
    dso: number
    avgDaysOverdue: number
    highestRisk: number
  }
}

export default function InvoiceAgingPage() {
  const [report, setReport] = useState<AgingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAgingReport()
  }, [asOfDate])

  const fetchAgingReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/reports/financial/invoices/aging?date=${asOfDate}`
      )
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Failed to fetch aging report:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Loading invoice aging report...</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-slate-400">Failed to load aging report</p>
      </div>
    )
  }

  const buckets = [
    { key: 'current', data: report.current, color: '#10B981' },
    { key: 'days30', data: report.days30, color: '#F59E0B' },
    { key: 'days60', data: report.days60, color: '#EC8030' },
    { key: 'days90', data: report.days90, color: '#EF4444' },
    { key: 'over90', data: report.over90, color: '#991B1B' },
  ]

  const chartData = buckets.map((b) => ({
    name: b.data.label,
    amount: b.data.amount,
    count: b.data.count,
  }))

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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Invoice Aging Report</h1>
              <p className="text-slate-400 mt-2 text-lg">Accounts receivable analysis and collection insights</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20">
            <Download className="h-4 w-4 mr-2 text-slate-300" />
            <span className="text-slate-300">Export PDF</span>
          </Button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-300">As of date:</label>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white backdrop-blur-xl focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <p className="text-slate-400 text-sm font-medium">Days Sales Outstanding</p>
              </div>
              <p className="text-4xl font-bold text-white mb-2">{report.metrics.dso}</p>
              <p className="text-slate-500 text-xs">days to collect payment</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Outstanding</p>
              <p className="text-4xl font-bold text-white mb-2">${(report.total.amount / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">{report.total.count} invoices</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-slate-400 text-sm font-medium">90+ Days Overdue</p>
              </div>
              <p className="text-4xl font-bold text-white mb-2">${(report.metrics.highestRisk / 1000).toFixed(1)}K</p>
              <p className="text-slate-500 text-xs">{report.over90.count} invoices at risk</p>
            </div>
          </div>
        </div>

        {/* Aging Chart */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Aging Bucket Analysis</h2>
            <p className="text-slate-400 text-sm mb-4">Outstanding invoice amounts by age category</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" label={{ value: 'Count', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.5)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px 12px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: '500' }}
                  formatter={(value, name) => {
                    if (name === 'amount') return [`$${value.toLocaleString()}`, 'Amount']
                    return [value, 'Count']
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="amount" fill="#4F46E5" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging Buckets */}
        <div className="space-y-4">
          {buckets.map((bucket) => (
            <div key={bucket.key} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-slate-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">{bucket.data.label}</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {bucket.data.count} invoices · ${bucket.data.amount.toLocaleString()} outstanding
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{bucket.data.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">of total AR</p>
                  </div>
                </div>
                {bucket.data.invoices.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3 font-semibold text-slate-300">Invoice #</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-300">Client</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-300">Amount</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-300">Outstanding</th>
                          <th className="text-right py-2 px-3 font-semibold text-slate-300">Days Overdue</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-300">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bucket.data.invoices.map((invoice, index) => (
                          <tr key={index} className="border-b border-white/10 hover:bg-white/5">
                            <td className="py-2 px-3 font-medium text-white">{invoice.invoiceNumber}</td>
                            <td className="py-2 px-3">
                              <div>
                                <p className="font-medium text-slate-300">{invoice.clientName}</p>
                                {invoice.clientEmail && (
                                  <p className="text-xs text-slate-500">{invoice.clientEmail}</p>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2 px-3 text-slate-300">${invoice.amount.toLocaleString()}</td>
                            <td className="text-right py-2 px-3 font-semibold text-white">
                              ${invoice.outstanding.toLocaleString()}
                            </td>
                            <td className="text-right py-2 px-3">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                  invoice.daysOverdue > 90
                                    ? 'bg-red-500/20 text-red-300'
                                    : invoice.daysOverdue > 60
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : invoice.daysOverdue > 30
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : invoice.daysOverdue > 0
                                    ? 'bg-orange-500/20 text-orange-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {invoice.daysOverdue}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Collection Actions */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-4">Collection Actions</h2>
            <p className="text-slate-400 text-sm mb-4">Recommended actions based on aging analysis</p>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-md">
                <p className="text-sm font-medium text-blue-300">Current Invoices</p>
                <p className="text-sm text-blue-200 mt-1">Send gentle payment reminder for upcoming due dates</p>
              </div>
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-md">
                <p className="text-sm font-medium text-yellow-300">30-60 Days Overdue</p>
                <p className="text-sm text-yellow-200 mt-1">Send follow-up payment requests and check for payment issues</p>
              </div>
              <div className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-md">
                <p className="text-sm font-medium text-orange-300">60-90 Days Overdue</p>
                <p className="text-sm text-orange-200 mt-1">Make direct phone contact and consider payment plans</p>
              </div>
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                <p className="text-sm font-medium text-red-300">90+ Days Overdue</p>
                <p className="text-sm text-red-200 mt-1">Escalate to management and consider collection agency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
