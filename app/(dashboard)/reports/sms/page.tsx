/**
 * SMS Analytics Report Page
 * Detailed analytics and insights for SMS campaigns with elegant dark theme
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, CheckCircle, BarChart3, PieChart } from 'lucide-react'

interface SMSMetrics {
  totalCampaigns: number
  totalMessagesSent: number
  successRate: number
  averageResponseRate: number
  totalRecipients: number
  failureRate: number
  monthlyGrowth: number
}

interface CampaignAnalytics {
  name: string
  status: string
  messagesSent: number
  successRate: number
  responseRate: number
  date: string
}

interface HourlyData {
  hour: string
  sent: number
  delivered: number
  failed: number
}

interface StatusBreakdown {
  status: string
  count: number
  percentage: number
  color: string
}

interface AnalyticsData {
  metrics: SMSMetrics
  campaignAnalytics: CampaignAnalytics[]
  hourlyData: HourlyData[]
  statusBreakdown: StatusBreakdown[]
}

export default function SMSReportPage() {
  const [dateRange, setDateRange] = useState('30days')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reports/sms')
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch SMS analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading SMS analytics...</p>
        </div>
      </div>
    )
  }

  const { metrics, campaignAnalytics, hourlyData, statusBreakdown } = data
  const totalSent = hourlyData.reduce((sum, d) => sum + d.sent, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                SMS Report
              </h1>
              <p className="text-slate-400 text-lg">Campaign performance and delivery analytics</p>
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
          {/* Total Messages */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Messages Sent</p>
                  <p className="text-3xl font-bold text-white">{(metrics.totalMessagesSent / 1000).toFixed(0)}k</p>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">+{metrics.monthlyGrowth}% growth</p>
                </div>
                <Send className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Success Rate</p>
                  <p className="text-3xl font-bold text-white">{metrics.successRate}%</p>
                  <p className="text-slate-400 text-xs mt-2">Delivered successfully</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Response Rate */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Response Rate</p>
                  <p className="text-3xl font-bold text-white">{metrics.averageResponseRate}%</p>
                  <p className="text-slate-400 text-xs mt-2">Avg per campaign</p>
                </div>
                <MessageSquare className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Total Campaigns */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Campaigns</p>
                  <p className="text-3xl font-bold text-white">{metrics.totalCampaigns}</p>
                  <p className="text-slate-400 text-xs mt-2">Total active</p>
                </div>
                <BarChart3 className="w-8 h-8 text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hourly Sending Pattern */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Messages by Hour
                </h3>

                <div className="space-y-4">
                  {hourlyData.map((data) => (
                    <div key={data.hour} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{data.hour}</span>
                        <span className="text-white font-medium">{data.sent.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full h-2"
                          style={{ width: `${(data.delivered / data.sent) * 100}%` }}
                        />
                        <span className="text-emerald-400">{Math.round((data.delivered / data.sent) * 100)}%</span>
                        <span className="text-red-400 ml-auto">{data.failed} failed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Campaign Performance
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Campaign</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Sent</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Success</th>
                        <th className="text-right text-slate-400 font-medium pb-3 px-3">Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignAnalytics.map((campaign, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <p className="text-white font-medium">{campaign.name}</p>
                          </td>
                          <td className="text-slate-300 py-3 px-3">{campaign.messagesSent.toLocaleString()}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold backdrop-blur border ${
                              campaign.status === 'SENT'
                                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
                                : campaign.status === 'PROCESSING'
                                  ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                                  : 'bg-slate-500/30 text-slate-300 border-slate-500/50'
                            }`}>
                              {campaign.successRate > 0 ? `${campaign.successRate}%` : 'Draft'}
                            </span>
                          </td>
                          <td className="text-right text-slate-300 py-3 px-3 font-medium">{campaign.responseRate > 0 ? `${campaign.responseRate}%` : '-'}</td>
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
            {/* Status Distribution */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-400" />
                  Campaign Status
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
                            item.status === 'SENT'
                              ? 'bg-emerald-500'
                              : item.status === 'PROCESSING'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
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

            {/* Performance Metrics */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Metrics Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Total Recipients</span>
                    <span className="text-sm font-semibold text-white">{metrics.totalRecipients.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Failure Rate</span>
                    <span className="text-sm font-semibold text-red-400">{metrics.failureRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Avg Campaign Size</span>
                    <span className="text-sm font-semibold text-emerald-400">{Math.round(metrics.totalMessagesSent / metrics.totalCampaigns).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-emerald-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Export Report</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-600/60 hover:to-cyan-600/60 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-200 rounded-lg font-semibold transition-all duration-300 text-sm">
                    Export as PDF
                  </button>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-600/60 hover:to-cyan-600/60 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-200 rounded-lg font-semibold transition-all duration-300 text-sm">
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
