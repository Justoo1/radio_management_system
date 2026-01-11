/**
 * Mount Points Management Page
 * Manage stream endpoints (formats, bitrates)
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  Plus,
  ArrowLeft,
  Users,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Star,
  RefreshCw,
} from 'lucide-react'

interface MountPoint {
  id: string
  name: string
  mountPoint: string
  url: string
  format: string
  bitrate: number
  isDefault: boolean
  currentListeners?: number
  uniqueListeners?: number
  liveUrl?: string
}

interface CreateMountPointForm {
  name: string
  mountPath: string
  format: string
  bitrate: number
  isDefault: boolean
}

const formats = [
  { value: 'mp3', label: 'MP3', description: 'Most compatible' },
  { value: 'aac', label: 'AAC', description: 'Better quality at lower bitrates' },
  { value: 'ogg', label: 'OGG Vorbis', description: 'Open source format' },
  { value: 'opus', label: 'Opus', description: 'Modern, efficient codec' },
  { value: 'flac', label: 'FLAC', description: 'Lossless audio' },
]

const bitrates = [64, 96, 128, 160, 192, 256, 320]

export default function MountPointsPage() {
  const [mountPoints, setMountPoints] = useState<MountPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState<CreateMountPointForm>({
    name: '',
    mountPath: '/radio',
    format: 'mp3',
    bitrate: 128,
    isDefault: false,
  })

  useEffect(() => {
    fetchMountPoints()
  }, [])

  const fetchMountPoints = async () => {
    try {
      const response = await fetch('/api/streaming/mount-points')
      if (response.ok) {
        const data = await response.json()
        setMountPoints(data.data || [])
      } else if (response.status === 404) {
        setMountPoints([])
      } else {
        throw new Error('Failed to fetch mount points')
      }
    } catch (err) {
      setError('Failed to load mount points')
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
        body: JSON.stringify({ type: 'mount_points' }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Synced ${data.data?.mountPoints?.synced || 0} mount points from AzuraCast`)
        setTimeout(() => setSuccess(null), 5000)
        fetchMountPoints() // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to sync mount points')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync mount points')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSyncing(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name || !form.mountPath) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(null), 5000)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/streaming/mount-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        setMountPoints([...mountPoints, data.data])
        setShowCreateModal(false)
        setForm({ name: '', mountPath: '/radio', format: 'mp3', bitrate: 128, isDefault: false })
        setSuccess('Mount point created successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to create mount point')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mount point')
      setTimeout(() => setError(null), 5000)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    setDeleting(id)

    try {
      const response = await fetch(`/api/streaming/mount-points?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMountPoints(mountPoints.filter((mp) => mp.id !== id))
        setSuccess('Mount point deleted successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to delete mount point')
      }
    } catch (err) {
      setError('Failed to delete mount point')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading mount points...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                Mount Points
              </h1>
              <p className="text-slate-400 text-lg">Manage your stream endpoints and formats</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300 disabled:opacity-50"
                title="Sync mount points from AzuraCast"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from AzuraCast'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Add Mount Point
              </button>
            </div>
          </div>
        </div>

        {/* Mount Points Grid */}
        {mountPoints.length === 0 ? (
          <div className="text-center py-12">
            <Radio className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No mount points configured</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Create your first mount point →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mountPoints.map((mp) => (
              <div key={mp.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 overflow-hidden p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500/30 to-cyan-600/30 p-2 rounded-lg border border-blue-400/30">
                        <Radio className="w-5 h-5 text-blue-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {mp.name}
                          {mp.isDefault && (
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          )}
                        </h3>
                        <p className="text-sm text-slate-400 font-mono">{mp.mountPoint}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Format</span>
                      <span className="text-white font-medium">{mp.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Bitrate</span>
                      <span className="text-white font-medium">{mp.bitrate} kbps</span>
                    </div>
                    {mp.currentListeners !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> Listeners
                        </span>
                        <span className="text-emerald-400 font-medium">{mp.currentListeners}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    {(mp.liveUrl || mp.url) && (
                      <a
                        href={mp.liveUrl || mp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all duration-300 text-sm font-semibold"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Listen
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(mp.id, mp.name)}
                      disabled={deleting === mp.id}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-300 text-sm font-semibold disabled:opacity-50"
                    >
                      {deleting === mp.id ? (
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Create Mount Point
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
                  placeholder="e.g., Main Stream, HD Stream"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mount Path *
                </label>
                <input
                  type="text"
                  value={form.mountPath}
                  onChange={(e) => setForm({ ...form, mountPath: e.target.value })}
                  placeholder="/radio"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Format
                </label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                >
                  {formats.map((f) => (
                    <option key={f.value} value={f.value} className="bg-slate-800">
                      {f.label} - {f.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bitrate
                </label>
                <select
                  value={form.bitrate}
                  onChange={(e) => setForm({ ...form, bitrate: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
                >
                  {bitrates.map((b) => (
                    <option key={b} value={b} className="bg-slate-800">
                      {b} kbps
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="isDefault" className="text-sm text-slate-300">
                  Set as default mount point
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
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
