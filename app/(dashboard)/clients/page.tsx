/**
 * Clients Management Page
 * List, search, and manage clients with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Filter, Users, ArrowUpRight } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  city: string
  status: string
  createdAt: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients?pageSize=100')
        const data = await response.json()

        if (data.data) {
          setClients(
            data.data.map((client: any) => ({
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone || 'N/A',
              city: client.city || 'N/A',
              status: client.status,
              createdAt: new Date(client.createdAt).toLocaleDateString(),
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || client.status === filter
    return matchesSearch && matchesFilter
  })

  const activeClientsCount = clients.filter((c) => c.status === 'ACTIVE').length
  const activePercentage = clients.length > 0 ? Math.round((activeClientsCount / clients.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/2 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Clients
              </h1>
              <p className="text-slate-400 text-lg">Manage your client list and relationships</p>
            </div>
            <Link
              href="/clients/new"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 backdrop-blur"
            >
              <Plus className="w-5 h-5" />
              Add Client
            </Link>
          </div>

          {/* Stats Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Clients</p>
                  <p className="text-3xl font-bold text-white">{clients.length}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    <span className="text-emerald-400 font-semibold">{activeClientsCount}</span> active clients
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  {activePercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity hidden" />
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
            >
              <option value="all" className="bg-slate-900 text-white">All Status</option>
              <option value="ACTIVE" className="bg-slate-900 text-white">Active</option>
              <option value="PROSPECT" className="bg-slate-900 text-white">Prospect</option>
              <option value="INACTIVE" className="bg-slate-900 text-white">Inactive</option>
            </select>
          </div>
        </div>

        {/* Clients Table */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-300">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400">Loading clients...</p>
                </div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400 mb-4 text-lg">No clients found</p>
                <Link
                  href="/clients/new"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  Add your first client →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        City
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
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {client.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{client.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{client.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">{client.city}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur ${
                              client.status === 'ACTIVE'
                                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                                : client.status === 'PROSPECT'
                                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                  : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                            }`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/clients/${client.id}`}
                              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure?')) {
                                  setClients(clients.filter((c) => c.id !== client.id))
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
          <span>Showing {filteredClients.length} of {clients.length} clients</span>
        </div>
      </div>
    </div>
  )
}
