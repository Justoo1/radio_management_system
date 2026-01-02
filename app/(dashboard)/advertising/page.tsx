/**
 * Advertising Management Page
 * Manage ad campaigns and slots
 */

'use client'

import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'
import { useState } from 'react'
import { Plus, Search, Calendar, DollarSign, BarChart3, Play, Pause, TrendingUp } from 'lucide-react'

export default function AdvertisingPage() {
  return (
    <FeatureGuard
      feature={Feature.ADVERTISEMENTS}
      featureDescription="Manage advertising campaigns, track ad performance, and maximize revenue"
    >
      <AdvertisingContent />
    </FeatureGuard>
  )
}

function AdvertisingContent() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'completed'>('all')

  // Placeholder data - will be replaced with actual API call
  const campaigns = []

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Advertising Management</h1>
            <p className="text-slate-400">Manage ad campaigns and track performance</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30">
            <Plus className="w-5 h-5" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Play className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Active Campaigns</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Scheduled</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold text-white">GH₵ 0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm">Impressions</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'scheduled', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  statusFilter === status
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Ad Campaigns Yet</h3>
          <p className="text-slate-400 mb-6">
            Create your first advertising campaign to start generating revenue. Track performance, manage ad slots, and optimize your advertising strategy.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30">
            <Plus className="w-5 h-5" />
            Create First Campaign
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Campaign Scheduling</h4>
          <p className="text-slate-400 text-sm">
            Schedule ad spots at specific times and dates. Manage recurring campaigns and optimize for peak hours.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-purple-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Revenue Tracking</h4>
          <p className="text-slate-400 text-sm">
            Track advertising revenue, monitor campaign budgets, and generate financial reports for stakeholders.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
          <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6 text-green-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Performance Analytics</h4>
          <p className="text-slate-400 text-sm">
            Analyze ad performance with detailed metrics including impressions, reach, and engagement rates.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="font-semibold text-blue-400 mb-2">Advertising Features</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Create and manage multiple ad campaigns</li>
          <li>• Schedule ads for specific time slots and programs</li>
          <li>• Track impressions and performance metrics</li>
          <li>• Manage client advertising contracts</li>
          <li>• Generate revenue reports</li>
          <li>• Automated ad rotation and scheduling</li>
        </ul>
      </div>
    </div>
  )
}
