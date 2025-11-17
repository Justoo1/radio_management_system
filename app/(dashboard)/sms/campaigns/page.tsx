/**
 * SMS Campaigns Management Page
 * List, create, and manage SMS campaigns
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Send } from 'lucide-react'

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
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/sms/campaigns')
        // const data = await response.json()
        // setCampaigns(data)

        // Mock data for now
        setCampaigns([
          {
            id: '1',
            name: 'Weekend Promo 2024',
            description: 'Special weekend promotion campaign',
            status: 'SENT',
            messageContent: 'Join us this weekend for exclusive deals! Reply STOP to opt out.',
            totalRecipients: 450,
            createdAt: '2024-02-01',
          },
          {
            id: '2',
            name: 'New Program Launch',
            description: 'Announcement for new morning show',
            status: 'SCHEDULED',
            messageContent: 'Excited to announce our new morning show starting Monday!',
            totalRecipients: 320,
            createdAt: '2024-02-05',
          },
          {
            id: '3',
            name: 'Monthly Newsletter',
            description: 'Regular monthly updates',
            status: 'DRAFT',
            messageContent: 'Check out this month\'s highlights from your favorite station.',
            totalRecipients: 0,
            createdAt: '2024-02-10',
          },
          {
            id: '4',
            name: 'Event Reminder',
            description: 'Reminder for special event',
            status: 'FAILED',
            messageContent: 'Reminder: Live concert this Friday at 8 PM!',
            totalRecipients: 200,
            createdAt: '2024-02-08',
          },
        ])
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
        return 'bg-green-100 text-green-700'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-700'
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700'
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700'
      case 'FAILED':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SMS Campaigns</h1>
          <p className="text-slate-600 mt-2">Create and manage SMS marketing campaigns</p>
        </div>
        <Link
          href="/dashboard/sms/campaigns/new"
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        >
          <option value="all">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PROCESSING">Processing</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading campaigns...</div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 mb-4">No campaigns found</p>
            <Link
              href="/dashboard/sms/campaigns/new"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Create your first campaign →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-xs text-slate-600">{campaign.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {campaign.messageContent}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {campaign.totalRecipients > 0 ? campaign.totalRecipients : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        {campaign.status === 'DRAFT' && (
                          <button
                            className="p-1 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded transition"
                            title="Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <Link
                          href={`/dashboard/sms/campaigns/${campaign.id}`}
                          className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="View"
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
                            className="p-1 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition"
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

      {/* Stats Footer */}
      <div className="mt-6 text-sm text-slate-600">
        Showing {filteredCampaigns.length} of {campaigns.length} campaigns
      </div>
    </div>
  )
}
