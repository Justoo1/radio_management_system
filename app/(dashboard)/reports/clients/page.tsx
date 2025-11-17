/**
 * Clients Analytics Report Page
 * Detailed analytics and insights for clients with elegant dark theme
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Users, DollarSign, BarChart3, PieChart, Calendar } from 'lucide-react'

interface ClientMetrics {
  totalClients: number
  activeClients: number
  prospectClients: number
  inactiveClients: number
  clientRetention: number
  averageClientValue: number
  monthlyGrowth: number
}

interface ClientData {
  month: string
  newClients: number
  activeClients: number
  revenue: number
}

export default function ClientsReportPage() {
  const [dateRange, setDateRange] = useState('30days')

  // Mock metrics data
  const metrics: ClientMetrics = {
    totalClients: 124,
    activeClients: 98,
    prospectClients: 18,
    inactiveClients: 8,
    clientRetention: 92.5,
    averageClientValue: 4500,
    monthlyGrowth: 8.5,
  }

  // Mock chart data
  const chartData: ClientData[] = [
    { month: 'Jan', newClients: 8, activeClients: 45, revenue: 18000 },
    { month: 'Feb', newClients: 12, activeClients: 52, revenue: 22000 },
    { month: 'Mar', newClients: 10, activeClients: 61, revenue: 25500 },
    { month: 'Apr', newClients: 15, activeClients: 72, revenue: 30000 },
    { month: 'May', newClients: 18, activeClients: 85, revenue: 35000 },
    { month: 'Jun', newClients: 14, activeClients: 98, revenue: 39500 },
  ]

  const topClients = [
    { name: 'Light FM Media', status: 'ACTIVE', campaigns: 12, revenue: 8500 },
    { name: 'Urban Radio Network', status: 'ACTIVE', campaigns: 8, revenue: 7200 },
    { name: 'Community Voices', status: 'ACTIVE', campaigns: 6, revenue: 6500 },
    { name: 'Digital Broadcasting Co', status: 'PROSPECT', campaigns: 2, revenue: 2000 },
    { name: 'Regional Media Group', status: 'INACTIVE', campaigns: 0, revenue: 0 },
  ]

  const statusBreakdown = [
    { status: 'ACTIVE', count: metrics.activeClients, percentage: Math.round((metrics.activeClients / metrics.totalClients) * 100), color: 'bg-emerald-500/30 text-emerald-300' },
    { status: 'PROSPECT', count: metrics.prospectClients, percentage: Math.round((metrics.prospectClients / metrics.totalClients) * 100), color: 'bg-amber-500/30 text-amber-300' },
    { status: 'INACTIVE', count: metrics.inactiveClients, percentage: Math.round((metrics.inactiveClients / metrics.totalClients) * 100), color: 'bg-slate-500/30 text-slate-300' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                Clients Report
              </h1>
              <p className="text-slate-400 text-lg">Detailed analytics and insights for your clients</p>
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm backdrop-blur transition-all duration-300 hover:border-white/30"
            >
              <option value="7days" className="bg-slate-900 text-white">Last 7 days</option>
              <option value="30days" className="bg-slate-900 text-white">Last 30 days</option>
              <option value="90days" className="bg-slate-900 text-white">Last 90 days</option>
              <option value="year" className="bg-slate-900 text-white">Last year</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Clients */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Total Clients</p>
                  <p className="text-3xl font-bold text-white">{metrics.totalClients}</p>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">+{metrics.monthlyGrowth}% this month</p>
                </div>
                <Users className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Active Clients</p>
                  <p className="text-3xl font-bold text-white">{metrics.activeClients}</p>
                  <p className="text-slate-400 text-xs mt-2">{Math.round((metrics.activeClients / metrics.totalClients) * 100)}% of total</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Average Client Value */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Avg Client Value</p>
                  <p className="text-3xl font-bold text-white">${(metrics.averageClientValue / 1000).toFixed(1)}k</p>
                  <p className="text-slate-400 text-xs mt-2">Per client annually</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Retention Rate */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Retention Rate</p>
                  <p className="text-3xl font-bold text-white">{metrics.clientRetention}%</p>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">Excellent</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Growth Chart */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Client Growth Trend
                </h3>

                {/* Mock Bar Chart */}
                <div className="space-y-4">
                  {chartData.map((data) => (
                    <div key={data.month} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{data.month}</span>
                        <span className="text-white font-medium">{data.activeClients} active</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${(data.activeClients / 100) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Clients Table */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Top Clients
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Client Name</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Status</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Campaigns</th>
                        <th className="text-right text-slate-400 font-medium pb-3 px-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClients.map((client, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="text-white font-medium py-3 px-3">{client.name}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold backdrop-blur border ${
                                client.status === 'ACTIVE'
                                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                                  : client.status === 'PROSPECT'
                                    ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                                    : 'bg-slate-500/30 text-slate-300 border-slate-500/50'
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                          <td className="text-slate-300 py-3 px-3">{client.campaigns}</td>
                          <td className="text-right text-slate-300 py-3 px-3 font-medium">${client.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            {/* Status Breakdown */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-400" />
                  Status Breakdown
                </h3>

                <div className="space-y-3">
                  {statusBreakdown.map((item) => (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${item.color}`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-slate-400">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : item.status === 'PROSPECT'
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{item.status}</span>
                      <span className="text-white font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Export Report</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 hover:from-blue-600/60 hover:to-cyan-600/60 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 rounded-lg font-semibold transition-all duration-300 text-sm">
                    Export as PDF
                  </button>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 hover:from-blue-600/60 hover:to-cyan-600/60 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 rounded-lg font-semibold transition-all duration-300 text-sm">
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
