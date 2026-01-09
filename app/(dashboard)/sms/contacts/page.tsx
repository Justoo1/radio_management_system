/**
 * SMS Contacts Management Page
 * List, create, import, and manage SMS contacts
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Users,
  UserX,
  Filter,
  Loader2,
  Phone,
  Mail,
  Tag,
  X,
} from 'lucide-react'
import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'

interface SMSContact {
  id: string
  phoneNumber: string
  name: string | null
  email: string | null
  category: string | null
  status: 'ACTIVE' | 'OPTED_OUT' | 'INVALID' | 'BOUNCED'
  source: string | null
  createdAt: string
}

interface CategoryInfo {
  name: string
  count: number
}

export default function SMSContactsPage() {
  return (
    <FeatureGuard
      feature={Feature.SMS_CAMPAIGNS}
      featureDescription="Manage your SMS contact lists"
    >
      <SMSContactsContent />
    </FeatureGuard>
  )
}

function SMSContactsContent() {
  const [contacts, setContacts] = useState<SMSContact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [totalContacts, setTotalContacts] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/sms/contacts?${params}`)
      const data = await response.json()

      if (data.data) {
        setContacts(data.data)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/sms/contacts/categories')
      const data = await response.json()
      if (data.data) {
        setCategories(data.data.categories)
        setTotalContacts(data.data.totalContacts)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  useEffect(() => {
    fetchContacts()
    fetchCategories()
  }, [page, search, statusFilter, categoryFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/sms/contacts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setContacts(contacts.filter((c) => c.id !== id))
        setTotalContacts((prev) => prev - 1)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleOptOut = async (id: string) => {
    if (!confirm('Are you sure you want to opt out this contact?')) return

    try {
      const response = await fetch(`/api/sms/contacts/${id}/opt-out`, {
        method: 'POST',
      })

      if (response.ok) {
        setContacts(
          contacts.map((c) =>
            c.id === id ? { ...c, status: 'OPTED_OUT' as const } : c
          )
        )
      }
    } catch (error) {
      console.error('Error opting out contact:', error)
    }
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)

    window.open(`/api/sms/contacts/export?${params}`, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
      case 'OPTED_OUT':
        return 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
      case 'INVALID':
        return 'bg-red-500/30 text-red-300 border border-red-500/50'
      case 'BOUNCED':
        return 'bg-orange-500/30 text-orange-300 border border-orange-500/50'
      default:
        return 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
    }
  }

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 12 && phone.startsWith('233')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`
    }
    return phone
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mb-2">
                SMS Contacts
              </h1>
              <p className="text-slate-400 text-lg">
                Manage your SMS contact lists and segments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium border border-white/20 transition-all duration-300"
              >
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-medium border border-white/20 transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Add Contact
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-slate-400 text-sm">Total Contacts</p>
                  <p className="text-2xl font-bold text-white">{totalContacts.toLocaleString()}</p>
                </div>
              </div>
            </div>
            {categories.slice(0, 3).map((cat) => (
              <div
                key={cat.name}
                className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => setCategoryFilter(cat.name === categoryFilter ? '' : cat.name)}
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-8 h-8 text-pink-400" />
                  <div>
                    <p className="text-slate-400 text-sm">{cat.name}</p>
                    <p className="text-2xl font-bold text-white">{cat.count.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone, name, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white backdrop-blur"
          >
            <option value="" className="bg-slate-900">All Status</option>
            <option value="ACTIVE" className="bg-slate-900">Active</option>
            <option value="OPTED_OUT" className="bg-slate-900">Opted Out</option>
            <option value="INVALID" className="bg-slate-900">Invalid</option>
            <option value="BOUNCED" className="bg-slate-900">Bounced</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white backdrop-blur"
          >
            <option value="" className="bg-slate-900">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name} className="bg-slate-900">
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Contacts Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400 mb-4 text-lg">No contacts found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Add your first contact →
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Source
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {contact.name || 'Unknown'}
                            </p>
                            {contact.email && (
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {contact.email}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-300 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhoneNumber(contact.phoneNumber)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {contact.category ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {contact.category}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(contact.status)}`}>
                            {contact.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {contact.source || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {contact.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOptOut(contact.id)}
                                className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/20 rounded-lg transition-all"
                                title="Opt Out"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(contact.id)}
                              disabled={deletingId === contact.id}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === contact.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                  <p className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Campaigns */}
        <div className="mt-6">
          <Link
            href="/sms/campaigns"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            ← Back to Campaigns
          </Link>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchContacts()
            fetchCategories()
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportContactsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            fetchContacts()
            fetchCategories()
          }}
        />
      )}
    </div>
  )
}

// Add Contact Modal Component
function AddContactModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    email: '',
    category: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/sms/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        alert(data.error || 'Failed to add contact')
      }
    } catch (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add contact')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Add Contact</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="0XX XXX XXXX"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              placeholder="Contact name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g., Listeners, VIP, Advertisers"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Import Contacts Modal Component
function ImportContactsModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [defaultCategory, setDefaultCategory] = useState('')
  const [updateExisting, setUpdateExisting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const phoneIndex = headers.findIndex((h) =>
      ['phone', 'phonenumber', 'phone_number', 'mobile', 'number'].includes(h)
    )
    const nameIndex = headers.findIndex((h) => ['name', 'fullname', 'full_name'].includes(h))
    const emailIndex = headers.findIndex((h) => ['email', 'e-mail'].includes(h))
    const categoryIndex = headers.findIndex((h) =>
      ['category', 'group', 'segment', 'tag'].includes(h)
    )

    if (phoneIndex === -1) return []

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim())
      return {
        phoneNumber: values[phoneIndex] || '',
        name: nameIndex >= 0 ? values[nameIndex] : undefined,
        email: emailIndex >= 0 ? values[emailIndex] : undefined,
        category: categoryIndex >= 0 ? values[categoryIndex] : undefined,
      }
    })
  }

  const handleImport = async () => {
    const contacts = parseCSV(csvData)

    if (contacts.length === 0) {
      alert('No valid contacts found. Make sure your CSV has a "phone" column.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sms/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          updateExisting,
          defaultCategory,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data.data)
      } else {
        alert(data.error || 'Failed to import contacts')
      }
    } catch (error) {
      console.error('Error importing contacts:', error)
      alert('Failed to import contacts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Import Contacts</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">
                Import Complete
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Total Processed</p>
                  <p className="text-white font-bold">{result.total}</p>
                </div>
                <div>
                  <p className="text-slate-400">Imported</p>
                  <p className="text-emerald-400 font-bold">{result.imported}</p>
                </div>
                <div>
                  <p className="text-slate-400">Duplicates</p>
                  <p className="text-amber-400 font-bold">{result.duplicates}</p>
                </div>
                <div>
                  <p className="text-slate-400">Invalid</p>
                  <p className="text-red-400 font-bold">{result.invalid}</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-slate-400 text-sm mb-2">Errors:</p>
                  <div className="text-xs text-red-400 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err: string, i: number) => (
                      <p key={i}>{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onSuccess}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                CSV Data
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Paste CSV with columns: phone, name, email, category (phone required)
              </p>
              <textarea
                rows={8}
                placeholder="phone,name,email,category
0241234567,John Doe,john@example.com,Listeners
0551234567,Jane Smith,jane@example.com,VIP"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Category
              </label>
              <input
                type="text"
                placeholder="Category for contacts without one"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-slate-500"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300">
                Update existing contacts with matching phone numbers
              </span>
            </label>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading || !csvData.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Import Contacts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
