/**
 * Programs Management Page
 * List, create, and manage radio programs with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Clock, Radio, ArrowUpRight } from 'lucide-react'

interface Program {
  id: string
  name: string
  description: string
  duration: number
  genre: string
  host: string
  isActive: boolean
  createdAt: string
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch('/api/programs?pageSize=100')
        const data = await response.json()

        if (data.data) {
          setPrograms(
            data.data.map((program: any) => ({
              id: program.id,
              name: program.name,
              description: program.description,
              duration: program.duration || 60,
              genre: program.genre || 'General',
              host: program.host || 'Unknown',
              isActive: program.isActive,
              createdAt: new Date(program.createdAt).toLocaleDateString(),
            }))
          )
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(search.toLowerCase()) ||
      program.genre.toLowerCase().includes(search.toLowerCase()) ||
      program.host.toLowerCase().includes(search.toLowerCase())
  )

  const activePrograms = programs.filter((p) => p.isActive).length
  const activePercentage = programs.length > 0 ? Math.round((activePrograms / programs.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Programs
              </h1>
              <p className="text-slate-400 text-lg">Manage your radio station programs and schedules</p>
            </div>
            <Link
              href="/programs/new"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 backdrop-blur"
            >
              <Plus className="w-5 h-5" />
              Create Program
            </Link>
          </div>

          {/* Stats Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium mb-1">Total Programs</p>
                  <p className="text-3xl font-bold text-white">{programs.length}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    <span className="text-emerald-400 font-semibold">{activePrograms}</span> active programs
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search programs by name, genre, or host..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30"
              />
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-slate-400">Loading programs...</p>
            </div>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No programs found</p>
            <Link
              href="/programs/new"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Create your first program →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 overflow-hidden p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{program.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{program.genre}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur whitespace-nowrap ml-2 ${
                        program.isActive
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                      }`}
                    >
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-grow">
                    {program.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(program.duration / 60)}h {program.duration % 60}m</span>
                  </div>

                  <div className="mb-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-slate-400">
                      <span className="font-medium text-slate-300">Host:</span> {program.host}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Link
                      href={`/programs/${program.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 text-purple-200 rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 text-sm font-semibold"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure?')) {
                          setPrograms(programs.filter((p) => p.id !== program.id))
                        }
                      }}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-300 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-6 text-sm text-slate-500 flex items-center justify-between">
          <span>Showing {filteredPrograms.length} of {programs.length} programs</span>
        </div>
      </div>
    </div>
  )
}
