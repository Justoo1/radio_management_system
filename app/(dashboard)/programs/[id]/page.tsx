/**
 * Program Detail/Edit Page
 * View and edit program information with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, Trash2, CheckCircle, AlertCircle, Clock, Users, Radio, TrendingUp } from 'lucide-react'

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

interface ProgramStats {
  listeners: number
  averageRating: number
  weeklyListeners: number
  retentionRate: number
}

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [program, setProgram] = useState<Program | null>(null)
  const [stats, setStats] = useState<ProgramStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    genre: '',
    host: '',
    durationHours: 0,
    durationMinutes: 0,
    isActive: false,
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
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/programs/${id}`)
        // const data = await response.json()

        // Mock data
        const mockProgram: Program = {
          id,
          name: 'Morning Drive Time',
          description: 'High-energy morning show with news, music, and entertainment for commuters',
          duration: 180,
          genre: 'Talk/News',
          host: 'John Mensah',
          isActive: true,
          createdAt: '2024-01-10',
        }

        const mockStats: ProgramStats = {
          listeners: 45230,
          averageRating: 4.7,
          weeklyListeners: 156800,
          retentionRate: 87,
        }

        setProgram(mockProgram)
        setStats(mockStats)
        setFormData({
          name: mockProgram.name,
          description: mockProgram.description,
          genre: mockProgram.genre,
          host: mockProgram.host,
          durationHours: Math.floor(mockProgram.duration / 60),
          durationMinutes: mockProgram.duration % 60,
          isActive: mockProgram.isActive,
        })
      } catch (error) {
        console.error('Failed to fetch program:', error)
        setErrors({ fetch: 'Failed to load program details' })
      } finally {
        setLoading(false)
      }
    }

    fetchProgram()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else if (name === 'durationHours' || name === 'durationMinutes') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }
    if (!formData.genre.trim()) {
      newErrors.genre = 'Genre is required'
    }
    if (!formData.host.trim()) {
      newErrors.host = 'Host name is required'
    }

    const totalMinutes = formData.durationHours * 60 + formData.durationMinutes
    if (totalMinutes === 0) {
      newErrors.duration = 'Duration must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/programs/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     duration: formData.durationHours * 60 + formData.durationMinutes,
      //   }),
      // })

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (program) {
        setProgram({
          ...program,
          name: formData.name,
          description: formData.description,
          genre: formData.genre,
          host: formData.host,
          duration: formData.durationHours * 60 + formData.durationMinutes,
          isActive: formData.isActive,
        })
      }

      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to update program:', error)
      setErrors({ submit: 'Failed to update program. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/programs/${id}`, {
      //   method: 'DELETE',
      // })

      // Mock delete
      await new Promise((resolve) => setTimeout(resolve, 1000))
      window.location.href = '/programs'
    } catch (error) {
      console.error('Failed to delete program:', error)
      setErrors({ delete: 'Failed to delete program. Please try again.' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading program details...</p>
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
          <Link href="/programs" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Programs
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {program.name}
              </h1>
              <p className="text-slate-400 text-lg">Created {new Date(program.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur ${
              program.isActive
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
            }`}>
              {program.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details & Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {saved && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Program updated successfully
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            {/* Program Information */}
            {!editing && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Program Details</h2>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Genre</p>
                      <p className="text-lg font-medium text-white">{program.genre}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Host</p>
                      <p className="text-lg font-medium text-white">{program.host}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Duration</p>
                      <p className="text-lg font-medium text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        {Math.floor(program.duration / 60)}h {program.duration % 60}m
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-slate-400 mb-2">Description</p>
                      <p className="text-slate-300 leading-relaxed">{program.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-6 px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 rounded-lg font-semibold transition-all duration-300"
                  >
                    Edit Program
                  </button>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editing && (
              <form onSubmit={handleSubmit} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-8 space-y-6">
                  <h2 className="text-xl font-bold text-white">Edit Program</h2>

                  {/* Program Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                      Program Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                      }`}
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 resize-none ${
                        errors.description ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                      }`}
                    />
                    {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
                  </div>

                  {/* Genre */}
                  <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-slate-300 mb-2">
                      Genre
                    </label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.genre ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                      }`}
                    >
                      <option value="Talk/News" className="bg-slate-900 text-white">
                        Talk/News
                      </option>
                      <option value="Music" className="bg-slate-900 text-white">
                        Music
                      </option>
                      <option value="Sports" className="bg-slate-900 text-white">
                        Sports
                      </option>
                      <option value="Entertainment" className="bg-slate-900 text-white">
                        Entertainment
                      </option>
                      <option value="Religious" className="bg-slate-900 text-white">
                        Religious
                      </option>
                      <option value="Educational" className="bg-slate-900 text-white">
                        Educational
                      </option>
                      <option value="Music/Entertainment" className="bg-slate-900 text-white">
                        Music/Entertainment
                      </option>
                    </select>
                    {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
                  </div>

                  {/* Host */}
                  <div>
                    <label htmlFor="host" className="block text-sm font-medium text-slate-300 mb-2">
                      Host/Presenter
                    </label>
                    <input
                      type="text"
                      id="host"
                      name="host"
                      value={formData.host}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.host ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                      }`}
                    />
                    {errors.host && <p className="text-red-400 text-sm mt-1">{errors.host}</p>}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="durationHours" className="block text-xs text-slate-400 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          id="durationHours"
                          name="durationHours"
                          min="0"
                          max="23"
                          value={formData.durationHours}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="durationMinutes" className="block text-xs text-slate-400 mb-1">
                          Minutes
                        </label>
                        <input
                          type="number"
                          id="durationMinutes"
                          name="durationMinutes"
                          min="0"
                          max="59"
                          value={formData.durationMinutes}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
                        />
                      </div>
                    </div>
                    {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration}</p>}
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-500 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-300">Mark as active program</span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-6 py-3 bg-white/10 border border-white/20 hover:border-white/40 text-slate-300 hover:text-white rounded-xl font-semibold transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Statistics */}
            {stats && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">Program Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Listeners</span>
                      <span className="text-sm font-semibold text-white">{stats.listeners.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Weekly Listeners</span>
                      <span className="text-sm font-semibold text-emerald-400">{stats.weeklyListeners.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Rating</span>
                      <span className="text-sm font-semibold text-purple-400">{stats.averageRating}/5</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Retention</span>
                      <span className="text-sm font-semibold text-blue-400">{stats.retentionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/programs/calendar`}
                    className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600/40 to-pink-600/40 hover:from-purple-600/60 hover:to-pink-600/60 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 rounded-lg text-center font-semibold transition-all duration-300"
                  >
                    View Schedule
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400/50 text-red-300 rounded-lg font-semibold transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Program
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
