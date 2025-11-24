/**
 * Create New Team Page
 * Form to create a new team with elegant dark theme
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface FormData {
  name: string
  description: string
  teamType: string
  teamLeadId: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function NewTeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    teamType: '',
    teamLeadId: '',
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load users for team lead dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users?pageSize=100')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

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
      newErrors.name = 'Team name is required'
    }

    if (!formData.teamType) {
      newErrors.teamType = 'Team type is required'
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
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          teamType: formData.teamType,
          teamLeadId: formData.teamLeadId || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create team')
      }

      setSaved(true)

      // Reset form
      setFormData({
        name: '',
        description: '',
        teamType: '',
        teamLeadId: '',
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        setSaved(false)
        window.location.href = '/teams'
      }, 3000)
    } catch (error) {
      console.error('Failed to create team:', error)
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create team. Please try again.',
      })
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
          <Link
            href="/teams"
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Teams
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Create New Team
          </h1>
          <p className="text-slate-400 text-lg">Create a new team to organize your station staff</p>
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
                    Team created successfully! Redirecting...
                  </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errors.submit}
                  </div>
                )}

                {/* Team Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Morning Drive Show"
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-purple-500'
                    }`}
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the team's purpose..."
                    rows={4}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 resize-none ${
                      errors.description
                        ? 'border-red-500/50 focus:ring-red-500'
                        : 'border-white/20 focus:ring-purple-500'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* Team Type */}
                <div>
                  <label htmlFor="teamType" className="block text-sm font-medium text-slate-300 mb-2">
                    Team Type *
                  </label>
                  <select
                    id="teamType"
                    name="teamType"
                    value={formData.teamType}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30 ${
                      errors.teamType
                        ? 'border-red-500/50 focus:ring-red-500'
                        : 'border-white/20 focus:ring-purple-500'
                    }`}
                  >
                    <option value="" className="bg-slate-900 text-white">
                      Select a team type
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
                    <option value="OTHER" className="bg-slate-900 text-white">
                      Other
                    </option>
                  </select>
                  {errors.teamType && <p className="text-red-400 text-sm mt-1">{errors.teamType}</p>}
                </div>

                {/* Team Lead */}
                <div>
                  <label
                    htmlFor="teamLeadId"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Team Lead (Optional)
                  </label>
                  <select
                    id="teamLeadId"
                    name="teamLeadId"
                    value={formData.teamLeadId}
                    onChange={handleChange}
                    disabled={loadingUsers}
                    className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.teamLeadId
                        ? 'border-red-500/50 focus:ring-red-500'
                        : 'border-white/20 focus:ring-purple-500'
                    }`}
                  >
                    <option value="" className="bg-slate-900 text-white">
                      {loadingUsers ? 'Loading users...' : 'Select a team lead (optional)'}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="bg-slate-900 text-white">
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.teamLeadId && (
                    <p className="text-red-400 text-sm mt-1">{errors.teamLeadId}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Team'}
                  </button>
                  <Link
                    href="/teams"
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
            {/* Team Types Info */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Team Types</h3>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <p className="font-medium text-white">Program Team</p>
                      <p className="text-xs">Hosts and producers for shows</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <p className="font-medium text-white">Engineering</p>
                      <p className="text-xs">Technical and broadcast engineers</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <p className="font-medium text-white">Sales</p>
                      <p className="text-xs">Advertising and sponsorship</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Best Practices */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Best Practices</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Assign a clear team lead</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Use descriptive team names</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Keep teams organized and focused</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Archive inactive teams</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
