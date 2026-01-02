'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Radio,
  MessageSquare,
  ArrowRight
} from 'lucide-react'

const reports = [
  {
    title: 'Financial Dashboard',
    description: 'Comprehensive financial overview with KPIs and real-time metrics',
    href: '/reports/financial',
    icon: DollarSign,
    colorGradient: 'from-blue-600/20 to-purple-600/20',
    borderColor: 'hover:border-blue-500/50',
    shadowColor: 'hover:shadow-blue-500/20',
    metrics: ['Revenue', 'Profit Margin', 'Collection Rate', 'DSO'],
  },
  {
    title: 'Profit & Loss',
    description: 'Detailed P&L analysis with revenue, expenses, and profit margins',
    href: '/reports/financial/pl',
    icon: BarChart3,
    colorGradient: 'from-emerald-600/20 to-cyan-600/20',
    borderColor: 'hover:border-emerald-500/50',
    shadowColor: 'hover:shadow-emerald-500/20',
    metrics: ['Gross Profit', 'Operating Profit', 'Net Profit', 'Margins'],
  },
  {
    title: 'Revenue Analysis',
    description: 'Revenue breakdown by client, source, and trends',
    href: '/reports/financial/revenue',
    icon: TrendingUp,
    colorGradient: 'from-orange-600/20 to-red-600/20',
    borderColor: 'hover:border-orange-500/50',
    shadowColor: 'hover:shadow-orange-500/20',
    metrics: ['Total Revenue', 'By Client', 'Growth Rate', 'Trends'],
  },
  {
    title: 'Invoice Aging',
    description: 'Accounts receivable analysis and collection insights',
    href: '/reports/financial/invoices/aging',
    icon: Calendar,
    colorGradient: 'from-purple-600/20 to-pink-600/20',
    borderColor: 'hover:border-purple-500/50',
    shadowColor: 'hover:shadow-purple-500/20',
    metrics: ['AR Analysis', 'DSO', 'Overdue Items', 'Collections'],
  },
  {
    title: 'Contract Analysis',
    description: 'Contract value, status, and revenue realization tracking',
    href: '/reports/financial/contracts',
    icon: PieChart,
    colorGradient: 'from-indigo-600/20 to-blue-600/20',
    borderColor: 'hover:border-indigo-500/50',
    shadowColor: 'hover:shadow-indigo-500/20',
    metrics: ['Total Value', 'Realization Rate', 'By Status', 'Top Clients'],
  },
  {
    title: 'Client Analytics',
    description: 'Client demographics, retention, and engagement metrics',
    href: '/reports/clients',
    icon: Users,
    colorGradient: 'from-pink-600/20 to-rose-600/20',
    borderColor: 'hover:border-pink-500/50',
    shadowColor: 'hover:shadow-pink-500/20',
    metrics: ['Total Clients', 'Retention', 'Growth', 'Value'],
  },
  {
    title: 'Programs Report',
    description: 'Radio program performance and audience metrics',
    href: '/reports/programs',
    icon: Radio,
    colorGradient: 'from-cyan-600/20 to-sky-600/20',
    borderColor: 'hover:border-cyan-500/50',
    shadowColor: 'hover:shadow-cyan-500/20',
    metrics: ['Programs', 'Audience', 'Performance', 'Schedule'],
  },
  {
    title: 'SMS Report',
    description: 'SMS campaign performance and engagement analysis',
    href: '/reports/sms',
    icon: MessageSquare,
    colorGradient: 'from-teal-600/20 to-emerald-600/20',
    borderColor: 'hover:border-teal-500/50',
    shadowColor: 'hover:shadow-teal-500/20',
    metrics: ['Campaigns', 'Sent', 'Delivered', 'Engaged'],
  },
]

interface QuickStats {
  totalRevenue: number
  totalClients: number
  activePrograms: number
  smsCampaigns: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuickStats()
  }, [])

  const fetchQuickStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch quick stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
        <div className="mb-12 pt-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Comprehensive business intelligence and performance metrics
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Revenue</p>
              {loading ? (
                <p className="text-2xl font-bold text-white mb-2">Loading...</p>
              ) : (
                <p className="text-4xl font-bold text-white mb-2">{stats ? formatCurrency(stats.totalRevenue) : '$0'}</p>
              )}
              <p className="text-slate-500 text-xs">From paid invoices</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Total Clients</p>
              {loading ? (
                <p className="text-2xl font-bold text-white mb-2">Loading...</p>
              ) : (
                <p className="text-4xl font-bold text-white mb-2">{stats?.totalClients || 0}</p>
              )}
              <p className="text-slate-500 text-xs">Active clients</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">Active Programs</p>
              {loading ? (
                <p className="text-2xl font-bold text-white mb-2">Loading...</p>
              ) : (
                <p className="text-4xl font-bold text-white mb-2">{stats?.activePrograms || 0}</p>
              )}
              <p className="text-slate-500 text-xs">Radio programs</p>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <p className="text-slate-400 text-sm font-medium mb-1">SMS Campaigns</p>
              {loading ? (
                <p className="text-2xl font-bold text-white mb-2">Loading...</p>
              ) : (
                <p className="text-4xl font-bold text-white mb-2">{stats?.smsCampaigns || 0}</p>
              )}
              <p className="text-slate-500 text-xs">Total sent</p>
            </div>
          </div>
        </div>

        {/* Financial Reports Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Financial Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.slice(0, 5).map((report) => {
              const Icon = report.icon
              return (
                <Link key={report.href} href={report.href}>
                  <div className="group relative h-full">
                    <div className={`absolute inset-0 bg-gradient-to-r ${report.colorGradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 ${report.borderColor} transition-all duration-300 hover:shadow-2xl ${report.shadowColor} h-full`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{report.title}</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            {report.description}
                          </p>
                        </div>
                        <Icon className="h-6 w-6 text-slate-300 flex-shrink-0" />
                      </div>

                      <div className="space-y-3 mt-4">
                        <p className="text-xs font-semibold text-slate-400">Key Metrics:</p>
                        <div className="flex flex-wrap gap-2">
                          {report.metrics.map((metric, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-xs bg-white/10 text-slate-300 px-2 py-1 rounded border border-white/10"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold group-hover:gap-2 transition-all">
                        View Report
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Operational Reports Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Operational Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.slice(5).map((report) => {
              const Icon = report.icon
              return (
                <Link key={report.href} href={report.href}>
                  <div className="group relative h-full">
                    <div className={`absolute inset-0 bg-gradient-to-r ${report.colorGradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 ${report.borderColor} transition-all duration-300 hover:shadow-2xl ${report.shadowColor} h-full`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{report.title}</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            {report.description}
                          </p>
                        </div>
                        <Icon className="h-6 w-6 text-slate-300 flex-shrink-0" />
                      </div>

                      <div className="space-y-3 mt-4">
                        <p className="text-xs font-semibold text-slate-400">Key Metrics:</p>
                        <div className="flex flex-wrap gap-2">
                          {report.metrics.map((metric, idx) => (
                            <span
                              key={idx}
                              className="inline-block text-xs bg-white/10 text-slate-300 px-2 py-1 rounded border border-white/10"
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center text-blue-400 text-sm font-semibold group-hover:gap-2 transition-all">
                        View Report
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Report Guide */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-4">Report Guide</h3>
            <p className="text-slate-400 text-sm mb-4">Understanding each report type</p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-1">Financial Reports</h4>
                <p className="text-sm text-slate-400">
                  Track revenue, profitability, cash flow, and financial health. Use these reports to monitor invoices, contracts, and payment collection.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Operational Reports</h4>
                <p className="text-sm text-slate-400">
                  Monitor business operations including client metrics, radio program performance, and SMS campaign effectiveness.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">Data Freshness</h4>
                <p className="text-sm text-slate-400">
                  All reports pull real-time data from the database. Some reports may have configurable date ranges for historical analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
