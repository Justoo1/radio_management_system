/**
 * SMS Campaigns Management Page
 * List, create, and manage SMS campaigns with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Send, MessageSquare, ArrowUpRight } from 'lucide-react'
import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'

interface SMSCampaign {
  id: string
  name: string
  description: string
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED'
  messageContent: string
  totalRecipients: number
  createdAt: string
}

export default function SMSCampaignsPage() {
  return (
    <FeatureGuard
      feature={Feature.SMS_CAMPAIGNS}
      featureDescription="Send targeted SMS campaigns to your clients and audience"
    >
      <SMSCampaignsContent />
    </FeatureGuard>
  )
}

function SMSCampaignsContent() {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/sms/campaigns?pageSize=100')
        const data = await response.json()

        if (data.data) {
          setCampaigns(
            data.data.map((campaign: any) => ({
              id: campaign.id,
              name: campaign.name,
              description: campaign.description || campaign.name,
              status: campaign.status,
              messageContent: campaign.message || '',
              totalRecipients: campaign.recipientCount || 0,
              createdAt: new Date(campaign.createdAt).toLocaleDateString(),
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      campaign.description.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || campaign.status === filter
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
      case 'SCHEDULED':
        return 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
      case 'PROCESSING':
        return 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
      case 'DRAFT':
        return 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
      case 'FAILED':
        return 'bg-red-500/30 text-red-300 border border-red-500/50'
      default:
        return 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
    }
  }

  const sentCampaigns = campaigns.filter((c) => c.status === 'SENT').length
  const sentPercentage = campaigns.length > 0 ? Math.round((sentCampaigns / campaigns.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                SMS Campaigns
              </h1>
              <p className="text-slate-400 text-lg">Create and manage SMS marketing campaigns</p>
            </div>
            <Link
              href="/sms/campaigns/new"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 backdrop-blur"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </Link>
          </div>

          {/* Stats Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Campaigns</p>
                  <p className="text-3xl font-bold text-white">{campaigns.length}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    <span className="text-emerald-400 font-semibold">{sentCampaigns}</span> sent this period
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  {sentPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30"
              />
            </div>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
          >
            <option value="all" className="bg-slate-900 text-white">All Status</option>
            <option value="DRAFT" className="bg-slate-900 text-white">Draft</option>
            <option value="SCHEDULED" className="bg-slate-900 text-white">Scheduled</option>
            <option value="PROCESSING" className="bg-slate-900 text-white">Processing</option>
            <option value="SENT" className="bg-slate-900 text-white">Sent</option>
            <option value="FAILED" className="bg-slate-900 text-white">Failed</option>
          </select>
        </div>

        {/* Campaigns Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-300">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block">
                  <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400">Loading campaigns...</p>
                </div>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 mb-4 text-lg">No campaigns found</p>
                <Link
                  href="/sms/campaigns/new"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Create your first campaign →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Campaign
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Message
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Recipients
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{campaign.name}</p>
                            <p className="text-xs text-slate-400">{campaign.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                          {campaign.messageContent}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {campaign.totalRecipients > 0 ? campaign.totalRecipients : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            {campaign.status === 'DRAFT' && (
                              <button
                                className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all duration-200"
                                title="Send"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            <Link
                              href={`/sms/campaigns/${campaign.id}`}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-all duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            {campaign.status !== 'SENT' && campaign.status !== 'PROCESSING' && (
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure?')) {
                                    setCampaigns(campaigns.filter((c) => c.id !== campaign.id))
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-6 text-sm text-slate-500 flex items-center justify-between">
          <span>Showing {filteredCampaigns.length} of {campaigns.length} campaigns</span>
        </div>
      </div>
    </div>
  )
}
