/**
 * New Program Form Page
 * Create and submit new radio program with elegant dark theme
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface FormData {
  name: string
  description: string
  genre: string
  host: string
  durationHours: number
  durationMinutes: number
  isActive: boolean
}

export default function NewProgramPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    genre: '',
    host: '',
    durationHours: 1,
    durationMinutes: 0,
    isActive: true,
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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
      // const response = await fetch('/api/programs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     duration: formData.durationHours * 60 + formData.durationMinutes,
      //   }),
      // })

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaved(true)

      // Reset form
      setFormData({
        name: '',
        description: '',
        genre: '',
        host: '',
        durationHours: 1,
        durationMinutes: 0,
        isActive: true,
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        setSaved(false)
        window.location.href = '/programs'
      }, 3000)
    } catch (error) {
      console.error('Failed to create program:', error)
      setErrors({ submit: 'Failed to create program. Please try again.' })
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Create New Program
          </h1>
          <p className="text-slate-400 text-lg">Add a new radio program to your schedule</p>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-8 space-y-6">
                {/* Success Message */}
                {saved && (
                  <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Program created successfully! Redirecting...
                  </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.submit}
                  </div>
                )}

                {/* Program Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Program Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morning Drive Time"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your program..."
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
                    Genre *
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
                    <option value="" className="bg-slate-900 text-white">
                      Select a genre
                    </option>
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
                    Host/Presenter Name *
                  </label>
                  <input
                    type="text"
                    id="host"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    placeholder="e.g., John Mensah"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.host ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                    }`}
                  />
                  {errors.host && <p className="text-red-400 text-sm mt-1">{errors.host}</p>}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration *
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
                  <p className="text-xs text-slate-500 mt-2">Active programs appear in schedules and broadcasts</p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Program'}
                  </button>
                  <Link
                    href="/programs"
                    className="px-6 py-3 bg-white/10 border border-white/20 hover:border-white/40 text-slate-300 hover:text-white rounded-xl font-semibold transition-all duration-300"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Form Tips */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Program Guidelines</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Use descriptive program names</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Include target audience info</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Specify host/presenter clearly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Set accurate program duration</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Genre Examples */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Popular Genres</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-purple-300">News/Talk</p>
                    <p className="text-xs text-slate-400">News, politics, discussions</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-300">Music</p>
                    <p className="text-xs text-slate-400">All music genres</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-300">Sports</p>
                    <p className="text-xs text-slate-400">Sports updates and analysis</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-300">Entertainment</p>
                    <p className="text-xs text-slate-400">Entertainment & comedy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
