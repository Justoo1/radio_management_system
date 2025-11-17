/**
 * Programs Analytics Report Page
 * Detailed analytics and insights for radio programs with elegant dark theme
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Radio, Users, Star, BarChart3, LineChart, Calendar } from 'lucide-react'

interface ProgramMetrics {
  totalPrograms: number
  activePrograms: number
  totalListeners: number
  averageRating: number
  peakListeningHour: string
  averageRetention: number
  monthlyGrowth: number
}

interface ProgramPerformance {
  name: string
  host: string
  listeners: number
  rating: number
  retention: number
  genre: string
}

export default function ProgramsReportPage() {
  const [dateRange, setDateRange] = useState('30days')

  // Mock metrics data
  const metrics: ProgramMetrics = {
    totalPrograms: 12,
    activePrograms: 11,
    totalListeners: 285420,
    averageRating: 4.5,
    peakListeningHour: '8:00 AM - 9:00 AM',
    averageRetention: 85.2,
    monthlyGrowth: 12.3,
  }

  // Mock program performance data
  const programPerformance: ProgramPerformance[] = [
    {
      name: 'Morning Drive Time',
      host: 'John Mensah',
      listeners: 45230,
      rating: 4.8,
      retention: 92,
      genre: 'Talk/News',
    },
    {
      name: 'Afternoon Vibes',
      host: 'Sarah Osei',
      listeners: 38500,
      rating: 4.6,
      retention: 88,
      genre: 'Music',
    },
    {
      name: 'Evening News Hour',
      host: 'Robert Boafo',
      listeners: 32100,
      rating: 4.4,
      retention: 82,
      genre: 'News',
    },
    {
      name: 'Late Night Sessions',
      host: 'DJ Alex',
      listeners: 28400,
      rating: 4.3,
      retention: 78,
      genre: 'Music',
    },
    {
      name: 'Weekend Specials',
      host: 'Various',
      listeners: 21500,
      rating: 4.2,
      retention: 75,
      genre: 'Entertainment',
    },
  ]

  // Listening patterns by hour
  const hourlyData = [
    { hour: '6am', listeners: 12000 },
    { hour: '7am', listeners: 28000 },
    { hour: '8am', listeners: 45000 },
    { hour: '9am', listeners: 42000 },
    { hour: '12pm', listeners: 28000 },
    { hour: '3pm', listeners: 35000 },
    { hour: '6pm', listeners: 32000 },
    { hour: '9pm', listeners: 22000 },
  ]

  const genreDistribution = [
    { genre: 'Music', programs: 5, percentage: 42, listeners: 120200 },
    { genre: 'News/Talk', programs: 3, percentage: 25, listeners: 77330 },
    { genre: 'Entertainment', programs: 2, percentage: 17, listeners: 48320 },
    { genre: 'Sports', programs: 1, percentage: 8, listeners: 22800 },
    { genre: 'Religious', programs: 1, percentage: 8, listeners: 22800 },
  ]

  const maxListeners = Math.max(...hourlyData.map(d => d.listeners))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl" />
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Programs Report
              </h1>
              <p className="text-slate-400 text-lg">Performance metrics and listener insights</p>
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
          {/* Total Programs */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Total Programs</p>
                  <p className="text-3xl font-bold text-white">{metrics.totalPrograms}</p>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">{metrics.activePrograms} active</p>
                </div>
                <Radio className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Total Listeners */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Total Listeners</p>
                  <p className="text-3xl font-bold text-white">{(metrics.totalListeners / 1000).toFixed(0)}k</p>
                  <p className="text-emerald-400 text-xs mt-2 font-semibold">+{metrics.monthlyGrowth}% growth</p>
                </div>
                <Users className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Avg Rating</p>
                  <p className="text-3xl font-bold text-white">{metrics.averageRating}/5</p>
                  <p className="text-slate-400 text-xs mt-2">Listener satisfaction</p>
                </div>
                <Star className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Peak Hour */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Peak Hour</p>
                  <p className="text-lg font-bold text-white">{metrics.peakListeningHour}</p>
                  <p className="text-slate-400 text-xs mt-2">Highest listeners</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hourly Listening Pattern */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-purple-400" />
                  Hourly Listening Pattern
                </h3>

                <div className="space-y-3">
                  {hourlyData.map((data) => (
                    <div key={data.hour} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{data.hour}</span>
                        <span className="text-white font-medium">{(data.listeners / 1000).toFixed(0)}k</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${(data.listeners / maxListeners) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Program Performance Table */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Program Performance
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Program</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Listeners</th>
                        <th className="text-left text-slate-400 font-medium pb-3 px-3">Rating</th>
                        <th className="text-right text-slate-400 font-medium pb-3 px-3">Retention</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programPerformance.map((program, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3">
                            <div>
                              <p className="text-white font-medium">{program.name}</p>
                              <p className="text-xs text-slate-400">{program.host}</p>
                            </div>
                          </td>
                          <td className="text-slate-300 py-3 px-3">{(program.listeners / 1000).toFixed(0)}k</td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 text-yellow-400 font-medium">
                              ★ {program.rating}
                            </span>
                          </td>
                          <td className="text-right text-slate-300 py-3 px-3 font-medium">{program.retention}%</td>
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
            {/* Genre Distribution */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Genre Distribution</h3>

                <div className="space-y-3">
                  {genreDistribution.map((item) => (
                    <div key={item.genre}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-300">{item.genre}</span>
                        <span className="text-sm text-slate-400">{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.programs} program{item.programs > 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audience Metrics */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Audience Metrics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Avg Retention</span>
                    <span className="text-sm font-semibold text-white">{metrics.averageRetention}%</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-sm text-slate-400">Per Program</span>
                    <span className="text-sm font-semibold text-purple-400">{Math.round(metrics.totalListeners / metrics.totalPrograms).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Active Programs</span>
                    <span className="text-sm font-semibold text-emerald-400">{metrics.activePrograms}/{metrics.totalPrograms}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Export Report</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 rounded-lg font-semibold transition-all duration-300 text-sm">
                    Export as PDF
                  </button>
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 rounded-lg font-semibold transition-all duration-300 text-sm">
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
