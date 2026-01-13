/**
 * Playlists Management Page
 * Manage AutoDJ playlists for streaming
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ListMusic,
  Plus,
  ArrowLeft,
  Music,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Shuffle,
  RefreshCw,
} from 'lucide-react'

interface Playlist {
  id: string
  name: string
  type: string
  isEnabled: boolean
  weight?: number
  scheduledStartTime?: string
  scheduledEndTime?: string
  scheduledDays?: string
  program?: {
    id: string
    name: string
  }
  _count?: {
    songs: number
  }
}

interface ScheduleItem {
  startTime: string
  endTime: string
  startDate?: string
  endDate?: string
  days: number[]
  loopOnce: boolean
}

interface CreatePlaylistForm {
  name: string
  type: string
  weight: number
  isEnabled: boolean
  programId?: string
  scheduleItems: ScheduleItem[]
}

interface Program {
  id: string
  name: string
}

const playlistTypes = [
  { value: 'default', label: 'General Rotation', description: 'Always plays based on weight' },
  { value: 'scheduled', label: 'Scheduled', description: 'Plays during specific times' },
  { value: 'once_per_hour', label: 'Once Per Hour', description: 'Plays one song per hour' },
  { value: 'once_per_day', label: 'Once Per Day', description: 'Plays once per day' },
]

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState<CreatePlaylistForm>({
    name: '',
    type: 'default',
    weight: 3,
    isEnabled: true,
    programId: undefined,
    scheduleItems: [{
      startTime: '',
      endTime: '',
      startDate: '',
      endDate: '',
      days: [],
      loopOnce: false,
    }],
  })

  const daysOfWeek = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [playlistsRes, programsRes] = await Promise.all([
        fetch('/api/streaming/playlists'),
        fetch('/api/programs?pageSize=100'),
      ])

      if (playlistsRes.ok) {
        const data = await playlistsRes.json()
        setPlaylists(data.data || [])
      } else if (playlistsRes.status === 404) {
        setPlaylists([])
      }

      if (programsRes.ok) {
        const data = await programsRes.json()
        setPrograms(data.data || [])
      }
    } catch (err) {
      setError('Failed to load playlists')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/streaming/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'playlists' }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Synced ${data.data?.playlists?.synced || 0} playlists from AzuraCast`)
        setTimeout(() => setSuccess(null), 5000)
        fetchData() // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to sync playlists')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync playlists')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name) {
      setError('Please enter a playlist name')
      setTimeout(() => setError(null), 5000)
      return
    }

    // Validate schedule items for scheduled playlists
    if (form.type === 'scheduled') {
      const schedule = form.scheduleItems[0]
      if (!schedule?.startTime || !schedule?.endTime) {
        setError('Please enter start and end times for the schedule')
        setTimeout(() => setError(null), 5000)
        return
      }
    }

    setCreating(true)
    setError(null)

    try {
      // Build payload - only include scheduleItems for scheduled type
      const payload = {
        ...form,
        scheduleItems: form.type === 'scheduled'
          ? form.scheduleItems.filter(s => s.startTime && s.endTime)
          : undefined,
      }

      const response = await fetch('/api/streaming/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        setPlaylists([...playlists, data.data])
        setShowCreateModal(false)
        setForm({ name: '', type: 'default', weight: 3, isEnabled: true, programId: undefined, scheduleItems: [{ startTime: '', endTime: '', startDate: '', endDate: '', days: [], loopOnce: false }] })
        setSuccess('Playlist created successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to create playlist')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playlist')
      setTimeout(() => setError(null), 5000)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/streaming/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentStatus }),
      })

      if (response.ok) {
        setPlaylists(playlists.map((p) => (p.id === id ? { ...p, isEnabled: !currentStatus } : p)))
        setSuccess(`Playlist ${!currentStatus ? 'enabled' : 'disabled'}`)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to update playlist')
      }
    } catch (err) {
      setError('Failed to update playlist')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete playlist "${name}"?`)) return

    setDeleting(id)

    try {
      const response = await fetch(`/api/streaming/playlists/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPlaylists(playlists.filter((p) => p.id !== id))
        setSuccess('Playlist deleted successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to delete playlist')
      }
    } catch (err) {
      setError('Failed to delete playlist')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  const getTypeLabel = (type: string) => {
    const found = playlistTypes.find((t) => t.value === type.toLowerCase())
    return found?.label || type
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'default':
        return 'bg-blue-500/30 text-blue-300 border-blue-500/50'
      case 'scheduled':
        return 'bg-purple-500/30 text-purple-300 border-purple-500/50'
      case 'once_per_hour':
        return 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50'
      case 'once_per_day':
        return 'bg-orange-500/30 text-orange-300 border-orange-500/50'
      default:
        return 'bg-slate-500/30 text-slate-300 border-slate-500/50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200 text-lg font-semibold">
              ×
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-300 hover:text-emerald-200 text-lg font-semibold">
              ×
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <Link
            href="/streaming"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Streaming
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                Playlists
              </h1>
              <p className="text-slate-400 text-lg">Manage AutoDJ playlists for your stream</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300 disabled:opacity-50"
                title="Sync playlists from AzuraCast"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from AzuraCast'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Create Playlist
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500/30 to-purple-600/30 p-2 rounded-lg border border-pink-400/30">
                  <ListMusic className="w-5 h-5 text-pink-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{playlists.length}</p>
                  <p className="text-sm text-slate-400">Total Playlists</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-2 rounded-lg border border-emerald-400/30">
                  <PlayCircle className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{playlists.filter((p) => p.isEnabled).length}</p>
                  <p className="text-sm text-slate-400">Active Playlists</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500/30 to-purple-600/30 p-2 rounded-lg border border-blue-400/30">
                  <Music className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {playlists.reduce((sum, p) => sum + (p._count?.songs || 0), 0)}
                  </p>
                  <p className="text-sm text-slate-400">Total Songs</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <ListMusic className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No playlists created</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-semibold transition-colors"
            >
              Create your first playlist →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-pink-500/50 transition-all duration-300 overflow-hidden p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border backdrop-blur ${playlist.isEnabled ? 'bg-gradient-to-br from-pink-500/30 to-purple-600/30 border-pink-400/30' : 'bg-gradient-to-br from-slate-500/30 to-slate-600/30 border-slate-400/30'}`}>
                        <ListMusic className={`w-5 h-5 ${playlist.isEnabled ? 'text-pink-300' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{playlist.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getTypeColor(playlist.type)}`}>
                          {getTypeLabel(playlist.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Music className="w-3 h-3" /> Songs
                      </span>
                      <span className="text-white font-medium">{playlist._count?.songs || 0}</span>
                    </div>

                    {playlist.weight && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Shuffle className="w-3 h-3" /> Weight
                        </span>
                        <span className="text-white font-medium">{playlist.weight}</span>
                      </div>
                    )}

                    {playlist.program && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Program</span>
                        <span className="text-purple-300 font-medium">{playlist.program.name}</span>
                      </div>
                    )}

                    {playlist.scheduledStartTime && playlist.scheduledEndTime && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{playlist.scheduledStartTime} - {playlist.scheduledEndTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    <Link
                      href={`/streaming/playlists/${playlist.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600/50 hover:to-purple-600/50 text-pink-200 rounded-lg border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 text-sm font-semibold"
                    >
                      <Edit className="w-4 h-4" />
                      Manage
                    </Link>
                    <button
                      onClick={() => handleToggleEnabled(playlist.id, playlist.isEnabled)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold ${
                        playlist.isEnabled
                          ? 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border border-slate-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {playlist.isEnabled ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id, playlist.name)}
                      disabled={deleting === playlist.id}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-300 text-sm font-semibold disabled:opacity-50"
                    >
                      {deleting === playlist.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 w-full max-w-md my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-pink-400" />
              Create Playlist
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Morning Rotation, Evening Chill"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white"
                >
                  {playlistTypes.map((t) => (
                    <option key={t.value} value={t.value} className="bg-slate-800">
                      {t.label} - {t.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Fields - Only shown for Scheduled type */}
              {form.type === 'scheduled' && (
                <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule Settings
                  </h3>

                  {/* Time Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={form.scheduleItems[0]?.startTime || ''}
                        onChange={(e) => {
                          const newSchedule = [...form.scheduleItems]
                          newSchedule[0] = { ...newSchedule[0], startTime: e.target.value }
                          setForm({ ...form, scheduleItems: newSchedule })
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={form.scheduleItems[0]?.endTime || ''}
                        onChange={(e) => {
                          const newSchedule = [...form.scheduleItems]
                          newSchedule[0] = { ...newSchedule[0], endTime: e.target.value }
                          setForm({ ...form, scheduleItems: newSchedule })
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Date Range (Optional) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={form.scheduleItems[0]?.startDate || ''}
                        onChange={(e) => {
                          const newSchedule = [...form.scheduleItems]
                          newSchedule[0] = { ...newSchedule[0], startDate: e.target.value }
                          setForm({ ...form, scheduleItems: newSchedule })
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={form.scheduleItems[0]?.endDate || ''}
                        onChange={(e) => {
                          const newSchedule = [...form.scheduleItems]
                          newSchedule[0] = { ...newSchedule[0], endDate: e.target.value }
                          setForm({ ...form, scheduleItems: newSchedule })
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Leave dates blank to play every day within the time range.</p>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2">
                      Play Days (Leave blank for every day)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const newSchedule = [...form.scheduleItems]
                            const currentDays = newSchedule[0]?.days || []
                            const newDays = currentDays.includes(day.value)
                              ? currentDays.filter(d => d !== day.value)
                              : [...currentDays, day.value]
                            newSchedule[0] = { ...newSchedule[0], days: newDays }
                            setForm({ ...form, scheduleItems: newSchedule })
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            form.scheduleItems[0]?.days?.includes(day.value)
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/10 text-slate-400 hover:bg-white/20'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loop Once */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="loopOnce"
                      checked={form.scheduleItems[0]?.loopOnce || false}
                      onChange={(e) => {
                        const newSchedule = [...form.scheduleItems]
                        newSchedule[0] = { ...newSchedule[0], loopOnce: e.target.checked }
                        setForm({ ...form, scheduleItems: newSchedule })
                      }}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="loopOnce" className="text-sm text-slate-300">
                      Loop Once
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 -mt-2">Only loop through the playlist once per scheduled time.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Weight (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 3 })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white"
                />
                <p className="text-xs text-slate-500 mt-1">Higher weight = more frequent plays</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link to Program (Optional)
                </label>
                <select
                  value={form.programId || ''}
                  onChange={(e) => setForm({ ...form, programId: e.target.value || undefined })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white"
                >
                  <option value="" className="bg-slate-800">No program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id} className="bg-slate-800">
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={form.isEnabled}
                  onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="isEnabled" className="text-sm text-slate-300">
                  Enable playlist immediately
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setForm({ name: '', type: 'default', weight: 3, isEnabled: true, programId: undefined, scheduleItems: [{ startTime: '', endTime: '', startDate: '', endDate: '', days: [], loopOnce: false }] })
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
