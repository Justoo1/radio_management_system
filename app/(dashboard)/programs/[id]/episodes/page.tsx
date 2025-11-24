/**
 * Program Episodes Page
 * Manage episodes for a program
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface Episode {
  id: string
  episodeNumber?: number
  title: string
  description?: string
  airDate: string
  status: 'SCHEDULED' | 'RECORDED' | 'AIRED' | 'CANCELLED'
}

interface Program {
  id: string
  name: string
}

const STATUS_COLORS: Record<Episode['status'], string> = {
  SCHEDULED: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  RECORDED: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  AIRED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/50',
}

export default function ProgramEpisodesPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [program, setProgram] = useState<Program | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    episodeNumber: '',
    title: '',
    description: '',
    airDate: '',
    status: 'SCHEDULED' as Episode['status'],
  })

  useEffect(() => {
    const loadParams = async () => {
      const { id: programId } = await params
      setId(programId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/programs/${id}`)
        if (response.ok) {
          const data = await response.json()
          setProgram(data)
        }
      } catch (error) {
        console.error('Failed to fetch program:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProgram()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'episodeNumber' ? (value ? parseInt(value) : '') : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Episode title is required' })
      return
    }

    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId
        ? `/api/programs/${id}/episodes/${editingId}`
        : `/api/programs/${id}/episodes`

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeNumber: formData.episodeNumber ? parseInt(formData.episodeNumber.toString()) : undefined,
          title: formData.title,
          description: formData.description,
          airDate: formData.airDate ? new Date(formData.airDate).toISOString() : undefined,
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save episode')
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        episodeNumber: '',
        title: '',
        description: '',
        airDate: '',
        status: 'SCHEDULED',
      })
      setMessage({ type: 'success', text: editingId ? 'Episode updated' : 'Episode added' })
      setTimeout(() => setMessage(null), 3000)

      // Reload episodes
      fetchProgram()
    } catch (error) {
      console.error('Failed to save episode:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save episode' })
    }
  }

  const handleDelete = async (episodeId: string) => {
    if (!confirm('Delete this episode?')) return

    try {
      const response = await fetch(`/api/programs/${id}/episodes/${episodeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete episode')
      }

      setMessage({ type: 'success', text: 'Episode deleted' })
      setTimeout(() => setMessage(null), 3000)
      fetchProgram()
    } catch (error) {
      console.error('Failed to delete episode:', error)
      setMessage({ type: 'error', text: 'Failed to delete episode' })
    }
  }

  const handleEdit = (episode: Episode) => {
    setEditingId(episode.id)
    setFormData({
      episodeNumber: episode.episodeNumber?.toString() || '',
      title: episode.title,
      description: episode.description || '',
      airDate: episode.airDate ? new Date(episode.airDate).toISOString().slice(0, 16) : '',
      status: episode.status,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      episodeNumber: '',
      title: '',
      description: '',
      airDate: '',
      status: 'SCHEDULED',
    })
  }

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProgram(data)
        // Episodes would be fetched from the API in production
        setEpisodes(data.episodes || [])
      }
    } catch (error) {
      console.error('Failed to fetch program:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading program episodes...</p>
        </div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="relative z-10 p-8">
          <Link href="/programs" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Program not found</p>
            <Link href="/programs" className="text-purple-400 hover:text-purple-300">
              Return to Programs →
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
          <Link href={`/programs/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Program
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
              {program.name} - Episodes
            </h1>
            <p className="text-slate-400 text-lg">Manage episodes and air dates</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-3xl">
          <div className="bg-white/10 rounded-xl border border-white/20 p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Episodes</h3>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                >
                  <Plus size={16} />
                  Add Episode
                </button>
              )}
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`p-3 rounded-lg mb-4 flex items-center gap-2 text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {message.text}
              </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Episode Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Episode Number
                    </label>
                    <input
                      type="number"
                      name="episodeNumber"
                      value={formData.episodeNumber}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Air Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Air Date
                    </label>
                    <input
                      type="datetime-local"
                      name="airDate"
                      value={formData.airDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    >
                      <option value="SCHEDULED" className="bg-slate-900">
                        Scheduled
                      </option>
                      <option value="RECORDED" className="bg-slate-900">
                        Recorded
                      </option>
                      <option value="AIRED" className="bg-slate-900">
                        Aired
                      </option>
                      <option value="CANCELLED" className="bg-slate-900">
                        Cancelled
                      </option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition"
                  >
                    {editingId ? 'Update' : 'Add'} Episode
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Episodes List */}
            {episodes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                {showForm ? 'Add an episode above' : 'No episodes added yet. Click "Add Episode" to get started.'}
              </div>
            ) : (
              <div className="space-y-2">
                {episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-white">
                          {episode.episodeNumber ? `Episode ${episode.episodeNumber}:` : ''} {episode.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full border ${
                            STATUS_COLORS[episode.status]
                          }`}
                        >
                          {episode.status}
                        </span>
                        {episode.airDate && (
                          <span className="text-xs text-slate-500">
                            {new Date(episode.airDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {episode.description && (
                        <p className="text-xs text-slate-400 mt-1">{episode.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(episode)}
                        className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(episode.id)}
                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {episodes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
                <p>{episodes.length} episode{episodes.length !== 1 ? 's' : ''} total</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
