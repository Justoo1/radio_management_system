/**
 * Dashboard Page
 * Main dashboard overview with stats and quick actions
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Users,
  Radio,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Calendar,
  Zap
} from 'lucide-react'

interface DashboardStats {
  clients: { total: number; active: number }
  programs: { total: number; active: number }
  campaigns: { total: number; sent: number }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Replace with actual API call to get dashboard stats
        // const response = await fetch('/api/dashboard/stats')
        // const data = await response.json()
        // setStats(data)

        // Mock data for now
        setStats({
          clients: { total: 24, active: 18 },
          programs: { total: 8, active: 6 },
          campaigns: { total: 42, sent: 35 },
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="min-h-screen ">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="mb-12 pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome back, {session?.user?.name || 'User'}!
              </h1>
              <p className="text-slate-400 mt-3 text-lg">
                Here's your radio station performance at a glance
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-300">Live Now</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Clients Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-3 rounded-xl border border-blue-400/30 backdrop-blur">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                {stats && stats.clients.active > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <ArrowUpRight className="w-4 h-4" />
                    75%
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Clients</p>
              <p className="text-4xl font-bold text-white mb-2">
                {loading ? '-' : stats?.clients.total}
              </p>
              <p className="text-slate-500 text-xs">
                <span className="text-emerald-400 font-semibold">{stats?.clients.active}</span> active clients
              </p>
            </div>
          </div>

          {/* Programs Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-600/30 p-3 rounded-xl border border-purple-400/30 backdrop-blur">
                  <Radio className="w-6 h-6 text-purple-300" />
                </div>
                {stats && stats.programs.active > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <ArrowUpRight className="w-4 h-4" />
                    100%
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Active Programs</p>
              <p className="text-4xl font-bold text-white mb-2">
                {loading ? '-' : stats?.programs.active}
              </p>
              <p className="text-slate-500 text-xs">
                <span className="text-slate-300">{stats?.programs.total}</span> total programs
              </p>
            </div>
          </div>

          {/* SMS Campaigns Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
                  <MessageSquare className="w-6 h-6 text-emerald-300" />
                </div>
                {stats && stats.campaigns.sent > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                    <ArrowUpRight className="w-4 h-4" />
                    83%
                  </div>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">SMS Campaigns</p>
              <p className="text-4xl font-bold text-white mb-2">
                {loading ? '-' : stats?.campaigns.total}
              </p>
              <p className="text-slate-500 text-xs">
                <span className="text-emerald-400 font-semibold">{stats?.campaigns.sent}</span> sent this month
              </p>
            </div>
          </div>

          {/* Growth Rate Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-orange-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-orange-500/30 to-red-600/30 p-3 rounded-xl border border-orange-400/30 backdrop-blur">
                  <TrendingUp className="w-6 h-6 text-orange-300" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  24%
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">Growth Rate</p>
              <p className="text-4xl font-bold text-white mb-2">12%</p>
              <p className="text-slate-500 text-xs">
                <span className="text-emerald-400 font-semibold">↑ 24%</span> from last month
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/clients/new"
                  className="block px-4 py-3 bg-gradient-to-r from-blue-600/40 to-blue-700/40 hover:from-blue-600/60 hover:to-blue-700/60 text-blue-200 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 text-sm font-semibold backdrop-blur"
                >
                  + Add New Client
                </Link>
                <Link
                  href="/programs/new"
                  className="block px-4 py-3 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 text-purple-200 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 text-sm font-semibold backdrop-blur"
                >
                  + Create Program
                </Link>
                <Link
                  href="/sms/campaigns/new"
                  className="block px-4 py-3 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-600/60 hover:to-cyan-600/60 text-emerald-200 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 text-sm font-semibold backdrop-blur"
                >
                  + Send SMS Campaign
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="lg:col-span-2 group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-b-0">
                  <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-blue-500/50" />
                  <div>
                    <p className="text-sm font-semibold text-white">New client added</p>
                    <p className="text-xs text-slate-400">Accra Media Agency joined your platform</p>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-b-0">
                  <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-purple-500/50" />
                  <div>
                    <p className="text-sm font-semibold text-white">Program scheduled</p>
                    <p className="text-xs text-slate-400">Morning Drive Time scheduled for Mon-Fri</p>
                    <p className="text-xs text-slate-500 mt-1">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-b-0">
                  <div className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-cyan-600 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-emerald-500/50" />
                  <div>
                    <p className="text-sm font-semibold text-white">SMS campaign sent</p>
                    <p className="text-xs text-slate-400">Weekend promo delivered to 450 contacts</p>
                    <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/activity"
                className="block mt-6 text-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-all duration-300"
              >
                View All Activity →
              </Link>
            </div>
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Getting Started */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-gradient-to-br from-blue-500/30 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30 hover:border-blue-300/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Getting Started</h3>
                  <p className="text-sm text-slate-300">
                    Set up your radio station profile and start managing your content seamlessly
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400 flex-shrink-0 opacity-50" />
              </div>
              <Link
                href="/dashboard/settings"
                className="inline-block mt-4 text-sm text-blue-300 hover:text-blue-200 font-semibold transition-colors"
              >
                Go to Settings →
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-500/30 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Need Help?</h3>
                  <p className="text-sm text-slate-300">
                    Access our documentation and support team for assistance anytime
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-400 flex-shrink-0 opacity-50" />
              </div>
              <Link
                href="#"
                className="inline-block mt-4 text-sm text-purple-300 hover:text-purple-200 font-semibold transition-colors"
              >
                View Documentation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
