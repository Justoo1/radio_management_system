/**
 * Client Detail/Edit Page
 * View and edit client information with elegant dark theme
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Save, ArrowLeft, Trash2, CheckCircle, AlertCircle, Phone, Mail, MapPin, Globe, BarChart3 } from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  city: string
  status: 'ACTIVE' | 'PROSPECT' | 'INACTIVE'
  website: string
  createdAt: string
}

interface ClientStats {
  totalCampaigns: number
  activeCampaigns: number
  totalRecipients: number
  conversionRate: number
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [client, setClient] = useState<Client | null>(null)
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({
    name: '',
    email: '',
    phone: '',
    city: '',
    status: 'PROSPECT',
    website: '',
  })

  useEffect(() => {
    const loadParams = async () => {
      const { id: clientId } = await params
      setId(clientId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    const fetchClient = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/clients/${id}`)
        // const data = await response.json()
        // setClient(data)

        // Mock data for now
        const mockClient: Client = {
          id,
          name: 'Light FM Media',
          email: 'contact@lightfm.com',
          phone: '+233 20 123 4567',
          city: 'Accra',
          status: 'ACTIVE',
          website: 'https://lightfm.com',
          createdAt: '2024-01-10',
        }

        const mockStats: ClientStats = {
          totalCampaigns: 12,
          activeCampaigns: 2,
          totalRecipients: 5420,
          conversionRate: 3.8,
        }

        setClient(mockClient)
        setStats(mockStats)
        setFormData({
          name: mockClient.name,
          email: mockClient.email,
          phone: mockClient.phone,
          city: mockClient.city,
          status: mockClient.status,
          website: mockClient.website,
        })
      } catch (error) {
        console.error('Failed to fetch client:', error)
        setErrors({ fetch: 'Failed to load client details' })
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      newErrors.name = 'Client name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
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
      // const response = await fetch(`/api/clients/${id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // })

      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update client
      if (client) {
        setClient({ ...client, ...formData })
      }

      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to update client:', error)
      setErrors({ submit: 'Failed to update client. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/clients/${id}`, {
      //   method: 'DELETE',
      // })

      // Mock delete
      await new Promise((resolve) => setTimeout(resolve, 1000))
      window.location.href = '/clients'
    } catch (error) {
      console.error('Failed to delete client:', error)
      setErrors({ delete: 'Failed to delete client. Please try again.' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="relative z-10 p-8">
          <Link href="/clients" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">Client not found</p>
            <Link href="/clients" className="text-blue-400 hover:text-blue-300">
              Return to Clients →
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/clients" className="flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                {client.name}
              </h1>
              <p className="text-slate-400 text-lg">Client since {new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold backdrop-blur ${
              client.status === 'ACTIVE'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                : client.status === 'PROSPECT'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
            }`}>
              {client.status}
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
                Client updated successfully
              </div>
            )}

            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.submit}
              </div>
            )}

            {/* Contact Information */}
            {!editing && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-8">
                  <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Mail className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <p className="text-white font-medium">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <p className="text-white font-medium">{client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-400">City</p>
                        <p className="text-white font-medium">{client.city}</p>
                      </div>
                    </div>
                    {client.website && (
                      <div className="flex items-start gap-4">
                        <Globe className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-slate-400">Website</p>
                          <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-medium">
                            {client.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-6 px-4 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 hover:from-blue-600/60 hover:to-cyan-600/60 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 rounded-lg font-semibold transition-all duration-300"
                  >
                    Edit Information
                  </button>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editing && (
              <form onSubmit={handleSubmit} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-8 space-y-6">
                  <h2 className="text-xl font-bold text-white">Edit Client Information</h2>

                  {/* Client Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                      }`}
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                      }`}
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.phone ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                      }`}
                    />
                    {errors.phone && <p className="text-red-400 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 ${
                        errors.city ? 'border-red-500/50 focus:ring-red-500' : 'border-white/20 focus:ring-blue-500'
                      }`}
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-slate-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white backdrop-blur transition-all duration-300 hover:border-white/30"
                    >
                      <option value="PROSPECT" className="bg-slate-900 text-white">
                        Prospect
                      </option>
                      <option value="ACTIVE" className="bg-slate-900 text-white">
                        Active
                      </option>
                      <option value="INACTIVE" className="bg-slate-900 text-white">
                        Inactive
                      </option>
                    </select>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Campaign Stats</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Total Campaigns</span>
                      <span className="text-sm font-semibold text-white">{stats.totalCampaigns}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Active Campaigns</span>
                      <span className="text-sm font-semibold text-emerald-400">{stats.activeCampaigns}</span>
                    </div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-sm text-slate-400">Total Recipients</span>
                      <span className="text-sm font-semibold text-white">{stats.totalRecipients.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Conversion Rate</span>
                      <span className="text-sm font-semibold text-blue-400">{stats.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-blue-500/50 transition-all duration-300 p-6">
                <h3 className="font-semibold text-white mb-4">Actions</h3>
                <div className="space-y-2">
                  <Link
                    href={`/clients/${id}`}
                    className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600/40 to-cyan-600/40 hover:from-blue-600/60 hover:to-cyan-600/60 border border-blue-500/30 hover:border-blue-400/50 text-blue-200 rounded-lg text-center font-semibold transition-all duration-300"
                  >
                    View Campaigns
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 justify-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400/50 text-red-300 rounded-lg font-semibold transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Client
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
