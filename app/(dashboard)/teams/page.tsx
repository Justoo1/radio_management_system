/**
 * Teams Management Page
 * List, create, and manage teams with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Trash2, Users, ArrowUpRight } from 'lucide-react'

interface TeamMember {
  id: string
  userId: string
  role: string
}

interface Team {
  id: string
  name: string
  description: string
  teamType: string
  teamLeadId?: string
  teamLead?: { name: string; email: string }
  status: string
  isActive: boolean
  members: TeamMember[]
  _count?: { members: number }
  createdAt: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamType, setTeamType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load teams on mount
  useEffect(() => {
    fetchTeams()
  }, [teamType, status])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        pageSize: '100',
      })

      if (teamType && teamType !== 'ALL') {
        params.append('teamType', teamType)
      }

      if (status && status !== 'ALL') {
        params.append('status', status)
      }

      const response = await fetch(`/api/teams?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Handle both array and object response
        const teamsList = Array.isArray(data) ? data : (data.data || [])
        setTeams(teamsList)
      } else {
        console.error('Failed to fetch teams:', response.statusText)
        setError('Failed to load teams')
      }
    } catch (err) {
      console.error('Failed to fetch teams:', err)
      setError('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the "${teamName}" team?`)) return

    try {
      setDeleting(teamId)
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete team')
      }

      setTeams(teams.filter((t) => t.id !== teamId))
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete team'
      setError(message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.description?.toLowerCase().includes(search.toLowerCase())
  )

  const activeTeams = teams.filter((t) => t.status === 'ACTIVE').length
  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200 text-lg font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Teams
              </h1>
              <p className="text-slate-400 text-lg">Manage your station teams and members</p>
            </div>
            <Link
              href="/teams/new"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 backdrop-blur"
            >
              <Plus className="w-5 h-5" />
              Create Team
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Teams */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Teams</p>
                    <p className="text-3xl font-bold text-white">{teams.length}</p>
                  </div>
                  <div className="text-purple-400">
                    <Users className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Teams */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Active Teams</p>
                    <p className="text-3xl font-bold text-white">{activeTeams}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {teams.length > 0
                        ? `${Math.round((activeTeams / teams.length) * 100)}% active`
                        : '0% active'}
                    </p>
                  </div>
                  <div className="text-emerald-400">
                    <ArrowUpRight className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Total Members */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Team Members</p>
                    <p className="text-3xl font-bold text-white">{totalMembers}</p>
                  </div>
                  <div className="text-blue-400">
                    <Users className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30"
              />
            </div>
          </div>

          {/* Team Type Filter */}
          <select
            value={teamType}
            onChange={(e) => setTeamType(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
          >
            <option value="ALL" className="bg-slate-900 text-white">
              All Team Types
            </option>
            <option value="PROGRAM_TEAM" className="bg-slate-900 text-white">
              Program Team
            </option>
            <option value="ENGINEERING" className="bg-slate-900 text-white">
              Engineering
            </option>
            <option value="SALES" className="bg-slate-900 text-white">
              Sales
            </option>
            <option value="OPERATIONS" className="bg-slate-900 text-white">
              Operations
            </option>
            <option value="MARKETING" className="bg-slate-900 text-white">
              Marketing
            </option>
            <option value="CONTENT" className="bg-slate-900 text-white">
              Content
            </option>
            <option value="MANAGEMENT" className="bg-slate-900 text-white">
              Management
            </option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
          >
            <option value="ALL" className="bg-slate-900 text-white">
              All Status
            </option>
            <option value="ACTIVE" className="bg-slate-900 text-white">
              Active
            </option>
            <option value="INACTIVE" className="bg-slate-900 text-white">
              Inactive
            </option>
            <option value="ARCHIVED" className="bg-slate-900 text-white">
              Archived
            </option>
          </select>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Loading teams...</p>
            </div>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No teams found</p>
            <Link
              href="/teams/new"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Create your first team →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <div key={team.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 overflow-hidden p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{team.name}</h3>
                      <p className="text-xs text-purple-300 mt-1">{team.teamType}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur whitespace-nowrap ml-2 ${
                        team.status === 'ACTIVE'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : team.status === 'INACTIVE'
                            ? 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                            : 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">
                    {team.description || 'No description'}
                  </p>

                  {team.teamLead && (
                    <div className="mb-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-slate-500 mb-1">Team Lead</p>
                      <p className="text-sm font-medium text-slate-300">{team.teamLead.name}</p>
                    </div>
                  )}

                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4" />
                    <span>{team.members?.length || 0} members</span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/teams/${team.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 text-purple-200 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 text-sm font-semibold"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => handleDelete(team.id, team.name)}
                      disabled={deleting === team.id}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-300 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === team.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 text-sm text-slate-500 flex items-center justify-between">
          <span>Showing {filteredTeams.length} of {teams.length} teams</span>
        </div>
      </div>
    </div>
  )
}
