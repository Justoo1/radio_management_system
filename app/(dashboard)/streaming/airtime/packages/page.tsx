/**
 * Airtime Packages Management Page
 * Manage pricing packages for remote airtime booking
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Check,
  GripVertical,
} from 'lucide-react'

interface AirtimePackage {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  currency: string
  isActive: boolean
  sortOrder: number
  allowedDays: number[] | null
  allowedHoursStart: string | null
  allowedHoursEnd: string | null
  _count?: {
    bookings: number
  }
}

interface PackageFormData {
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
  isActive: boolean
  sortOrder: number
}

const defaultFormData: PackageFormData = {
  name: '',
  description: '',
  durationMinutes: 30,
  price: 0,
  currency: 'GHS',
  isActive: true,
  sortOrder: 0,
}

export default function AirtimePackagesPage() {
  const [packages, setPackages] = useState<AirtimePackage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<AirtimePackage | null>(null)
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPackages = useCallback(async () => {
    try {
      const response = await fetch('/api/airtime/packages')
      if (!response.ok) throw new Error('Failed to fetch packages')
      const data = await response.json()
      setPackages(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  const openCreateModal = () => {
    setEditingPackage(null)
    setFormData({
      ...defaultFormData,
      sortOrder: packages.length,
    })
    setShowModal(true)
  }

  const openEditModal = (pkg: AirtimePackage) => {
    setEditingPackage(pkg)
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      durationMinutes: pkg.durationMinutes,
      price: pkg.price,
      currency: pkg.currency,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPackage(null)
    setFormData(defaultFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const url = editingPackage
        ? `/api/airtime/packages/${editingPackage.id}`
        : '/api/airtime/packages'

      const response = await fetch(url, {
        method: editingPackage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save package')
      }

      setSuccess(editingPackage ? 'Package updated successfully' : 'Package created successfully')
      setTimeout(() => setSuccess(null), 3000)
      closeModal()
      fetchPackages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/airtime/packages/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete package')
      }

      setSuccess('Package deleted successfully')
      setTimeout(() => setSuccess(null), 3000)
      setDeleteId(null)
      fetchPackages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete package')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (pkg: AirtimePackage) => {
    try {
      const response = await fetch(`/api/airtime/packages/${pkg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      })

      if (!response.ok) throw new Error('Failed to update package')
      fetchPackages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update package')
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading packages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/streaming/airtime"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Airtime Packages
              </h1>
              <p className="text-slate-400 text-lg">Manage pricing packages for remote airtime booking</p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add Package
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        {packages.length === 0 ? (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center">
              <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Packages Yet</h3>
              <p className="text-slate-400 mb-6">Create your first airtime package to allow guests to book broadcast time.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Create Package
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${pkg.isActive ? 'from-cyan-600/20 to-blue-600/20' : 'from-slate-600/20 to-slate-600/20'} rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border ${pkg.isActive ? 'border-white/20 hover:border-cyan-500/50' : 'border-white/10 opacity-60'} transition-all duration-300`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`bg-gradient-to-br ${pkg.isActive ? 'from-cyan-500/30 to-blue-600/30 border-cyan-400/30' : 'from-slate-500/30 to-slate-600/30 border-slate-400/30'} p-3 rounded-xl border backdrop-blur`}>
                        <Package className={`w-5 h-5 ${pkg.isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{pkg.name}</h3>
                        <p className="text-sm text-slate-400">
                          {pkg._count?.bookings || 0} booking{(pkg._count?.bookings || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`p-1 rounded-lg transition-colors ${pkg.isActive ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}
                      title={pkg.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {pkg.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{pkg.description}</p>
                  )}

                  {/* Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>{formatDuration(pkg.durationMinutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span className="text-2xl font-bold text-white">{pkg.currency} {pkg.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteId(pkg.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {editingPackage ? 'Edit Package' : 'Create Package'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="e.g., 30 Minutes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                    placeholder="Brief description of this package..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                      required
                      min={15}
                      max={480}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Price ({formData.currency}) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                      min={0}
                      step="0.01"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="GHS">GHS (Ghana Cedis)</option>
                    <option value="USD">USD (US Dollars)</option>
                    <option value="EUR">EUR (Euros)</option>
                    <option value="GBP">GBP (British Pounds)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`p-1 rounded-lg transition-colors ${formData.isActive ? 'text-emerald-400' : 'text-slate-500'}`}
                  >
                    {formData.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                  <div>
                    <p className="font-medium text-white">Active</p>
                    <p className="text-sm text-slate-400">
                      {formData.isActive ? 'Package is available for booking' : 'Package is hidden from guests'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 font-medium transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingPackage ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-red-500/20 p-3 rounded-xl border border-red-500/30">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Package</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to delete this package? Any existing bookings using this package will not be affected.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
