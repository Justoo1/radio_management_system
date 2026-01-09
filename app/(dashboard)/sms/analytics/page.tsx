/**
 * SMS Analytics Dashboard
 * Comprehensive analytics for SMS campaigns
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Send,
  CheckCircle,
  XCircle,
  CreditCard,
  MessageSquare,
  Loader2,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'

interface AnalyticsData {
  summary: {
    totalCampaigns: number
    activeCampaigns: number
    completedCampaigns: number
    totalSent: number
    totalDelivered: number
    totalFailed: number
    deliveryRate: number
    creditsAvailable: number
    creditsUsed: number
    monthlyAllocation: number
    monthlyUsed: number
  }
  charts: {
    byStatus: { name: string; value: number }[]
    byDay: { date: string; sent: number; delivered: number; failed: number }[]
    campaignsByStatus: { name: string; value: number }[]
  }
  topCampaigns: {
    id: string
    name: string
    recipients: number
    delivered: number
    deliveryRate: number
  }[]
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function SMSAnalyticsPage() {
  return (
    <FeatureGuard
      feature={Feature.SMS_CAMPAIGNS}
      featureDescription="View SMS campaign analytics and insights"
    >
      <SMSAnalyticsContent />
    </FeatureGuard>
  )
}

function SMSAnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/sms/analytics?days=${days}`)
        const data = await response.json()
        if (data.data) {
          setAnalytics(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [days])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Unable to load analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                SMS Analytics
              </h1>
              <p className="text-slate-400 text-lg">
                Track your SMS campaign performance and insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-white backdrop-blur"
              >
                <option value="7" className="bg-slate-900">Last 7 days</option>
                <option value="30" className="bg-slate-900">Last 30 days</option>
                <option value="90" className="bg-slate-900">Last 90 days</option>
              </select>
              <Link
                href="/sms/campaigns"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                Campaigns
              </Link>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Sent */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Sent</p>
                  <p className="text-3xl font-bold text-white">
                    {analytics.summary.totalSent.toLocaleString()}
                  </p>
                  <p className="text-emerald-400 text-sm mt-1">
                    {analytics.summary.deliveryRate}% delivered
                  </p>
                </div>
                <Send className="w-10 h-10 text-cyan-400/50" />
              </div>
            </div>

            {/* Delivered */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Delivered</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {analytics.summary.totalDelivered.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Successfully received
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-emerald-400/50" />
              </div>
            </div>

            {/* Failed */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-400">
                    {analytics.summary.totalFailed.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    Delivery failures
                  </p>
                </div>
                <XCircle className="w-10 h-10 text-red-400/50" />
              </div>
            </div>

            {/* Credits */}
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Credits Available</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {analytics.summary.creditsAvailable.toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {analytics.summary.monthlyAllocation > 0 && (
                      <>{analytics.summary.monthlyUsed.toLocaleString()} / {analytics.summary.monthlyAllocation.toLocaleString()} monthly</>
                    )}
                  </p>
                </div>
                <CreditCard className="w-10 h-10 text-purple-400/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Delivery Timeline */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Delivery Timeline
            </h3>
            {analytics.charts.byDay.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.charts.byDay}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#colorSent)"
                      name="Sent"
                    />
                    <Area
                      type="monotone"
                      dataKey="delivered"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorDelivered)"
                      name="Delivered"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <p>No data available for this period</p>
              </div>
            )}
          </div>

          {/* Message Status Distribution */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Message Status
            </h3>
            {analytics.charts.byStatus.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.charts.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {analytics.charts.byStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <p>No messages sent yet</p>
              </div>
            )}
          </div>

          {/* Campaign Status */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Campaign Status
            </h3>
            {analytics.charts.campaignsByStatus.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.charts.campaignsByStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#94a3b8"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <p>No campaigns created yet</p>
              </div>
            )}
          </div>

          {/* Top Campaigns */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Performing Campaigns
            </h3>
            {analytics.topCampaigns.length > 0 ? (
              <div className="space-y-4">
                {analytics.topCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-500">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-white font-medium">{campaign.name}</p>
                        <p className="text-sm text-slate-400">
                          {campaign.recipients.toLocaleString()} recipients
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">
                        {campaign.deliveryRate}%
                      </p>
                      <p className="text-xs text-slate-500">delivery rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">
                <p>No completed campaigns yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-white">
                {analytics.summary.totalCampaigns}
              </p>
              <p className="text-sm text-slate-400">Total Campaigns</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-purple-400">
                {analytics.summary.activeCampaigns}
              </p>
              <p className="text-sm text-slate-400">Active</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-emerald-400">
                {analytics.summary.completedCampaigns}
              </p>
              <p className="text-sm text-slate-400">Completed</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <p className="text-3xl font-bold text-cyan-400">
                {analytics.summary.creditsUsed.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400">Credits Used</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <Link
            href="/sms/campaigns"
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            ← Back to Campaigns
          </Link>
          <Link
            href="/sms/contacts"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Manage Contacts →
          </Link>
        </div>
      </div>
    </div>
  )
}
