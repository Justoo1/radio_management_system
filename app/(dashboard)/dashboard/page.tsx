/**
 * Dashboard Page
 * Main dashboard overview with stats and quick actions
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Users, Radio, MessageSquare, TrendingUp } from 'lucide-react'

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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {session?.user?.name || 'User'}! 👋
        </h1>
        <p className="text-slate-600 mt-2">Here's what's happening with your radio station today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Clients Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Clients</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {loading ? '-' : stats?.clients.total}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats?.clients.active} active
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Programs Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Programs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {loading ? '-' : stats?.programs.active}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                of {stats?.programs.total} total
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Radio className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* SMS Campaigns Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">SMS Campaigns</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {loading ? '-' : stats?.campaigns.total}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats?.campaigns.sent} sent
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Growth Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Growth Rate</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">12%</p>
              <p className="text-xs text-green-600 mt-1">
                This month
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Card */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/clients/new"
              className="block px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
            >
              + Add New Client
            </Link>
            <Link
              href="/dashboard/programs/new"
              className="block px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-medium"
            >
              + Create Program
            </Link>
            <Link
              href="/dashboard/sms/campaigns/new"
              className="block px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-medium"
            >
              + Send SMS Campaign
            </Link>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b last:border-b-0">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">New client added</p>
                <p className="text-xs text-slate-600">Accra Media Agency joined your platform</p>
                <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b last:border-b-0">
              <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">Program scheduled</p>
                <p className="text-xs text-slate-600">Morning Drive Time scheduled for Mon-Fri</p>
                <p className="text-xs text-slate-400 mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4 pb-4 border-b last:border-b-0">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">SMS campaign sent</p>
                <p className="text-xs text-slate-600">Weekend promo campaign delivered to 450 contacts</p>
                <p className="text-xs text-slate-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/activity"
            className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Activity
          </Link>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Getting Started */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <p className="text-sm text-blue-800 mb-4">
            Set up your radio station profile and start managing your content
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Settings →
          </Link>
        </div>

        {/* Support */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Need Help?</h3>
          <p className="text-sm text-purple-800 mb-4">
            Check out our documentation or contact support for assistance
          </p>
          <Link
            href="#"
            className="inline-block text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View Documentation →
          </Link>
        </div>
      </div>
    </div>
  )
}
