/**
 * Programs Management Page
 * List, create, and manage radio programs
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, Clock } from 'lucide-react'

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
        // TODO: Replace with actual API call
        // const response = await fetch('/api/programs')
        // const data = await response.json()
        // setPrograms(data)

        // Mock data for now
        setPrograms([
          {
            id: '1',
            name: 'Morning Drive Time',
            description: 'High-energy morning show with news and entertainment',
            duration: 180,
            genre: 'Talk/News',
            host: 'John Mensah',
            isActive: true,
            createdAt: '2024-01-10',
          },
          {
            id: '2',
            name: 'Afternoon Vibes',
            description: 'Relaxing music and conversations for the afternoon',
            duration: 240,
            genre: 'Music',
            host: 'Sarah Osei',
            isActive: true,
            createdAt: '2024-01-15',
          },
          {
            id: '3',
            name: 'Evening News Hour',
            description: 'In-depth news coverage and analysis',
            duration: 60,
            genre: 'News',
            host: 'Robert Boafo',
            isActive: true,
            createdAt: '2024-01-20',
          },
          {
            id: '4',
            name: 'Late Night Sessions',
            description: 'Music and entertainment for late night listeners',
            duration: 120,
            genre: 'Music/Entertainment',
            host: 'DJ Alex',
            isActive: false,
            createdAt: '2024-02-01',
          },
        ])
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Programs</h1>
          <p className="text-slate-600 mt-2">Manage your radio station programs and schedules</p>
        </div>
        <Link
          href="/dashboard/programs/new"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create Program
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search programs by name, genre, or host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Programs Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading programs...</div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No programs found</p>
          <Link
            href="/dashboard/programs/new"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Create your first program →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{program.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{program.genre}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    program.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {program.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {program.description}
              </p>

              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                <Clock className="w-4 h-4" />
                <span>{Math.floor(program.duration / 60)}h {program.duration % 60}m</span>
              </div>

              <div className="mb-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Host:</span> {program.host}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/programs/${program.id}`}
                  className="flex-1 text-center px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition text-sm font-medium"
                >
                  View
                </Link>
                <button
                  onClick={() => {
                    if (confirm('Are you sure?')) {
                      setPrograms(programs.filter((p) => p.id !== program.id))
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 text-sm text-slate-600">
        Showing {filteredPrograms.length} of {programs.length} programs
      </div>
    </div>
  )
}
