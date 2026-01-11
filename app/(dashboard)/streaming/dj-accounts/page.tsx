/**
 * DJ Accounts Management Page
 * Manage live streamers and DJ accounts
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Mic,
  Plus,
  ArrowLeft,
  User,
  Clock,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Radio,
  WifiOff,
  Copy,
  Server,
  Wifi,
} from 'lucide-react'

interface DJAccount {
  id: string
  username: string
  displayName: string
  isActive: boolean
  lastConnectedAt?: string
  user?: {
    id: string
    name: string
    email: string
  }
}

interface StreamingServerInfo {
  host: string
  port: number
  mountPoint: string
  protocol: string
}

interface CreateDJForm {
  username: string
  displayName: string
  password: string
  userId?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
}

export default function DJAccountsPage() {
  const [accounts, setAccounts] = useState<DJAccount[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [serverInfo, setServerInfo] = useState<StreamingServerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [form, setForm] = useState<CreateDJForm>({
    username: '',
    displayName: '',
    password: '',
    userId: undefined,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [accountsRes, usersRes, configRes] = await Promise.all([
        fetch('/api/streaming/dj-accounts'),
        fetch('/api/users?pageSize=100'),
        fetch('/api/streaming/config'),
      ])

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.data || [])
      } else if (accountsRes.status === 404) {
        setAccounts([])
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setTeamMembers(data.data || [])
      }

      // Extract server info from config
      if (configRes.ok) {
        const configData = await configRes.json()
        if (configData.data?.streamUrl) {
          try {
            const url = new URL(configData.data.streamUrl)
            setServerInfo({
              host: url.hostname,
              port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 8000),
              mountPoint: url.pathname || '/radio.mp3',
              protocol: url.protocol.replace(':', ''),
            })
          } catch {
            // If URL parsing fails, try to extract from env
            const azuracastUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || ''
            if (azuracastUrl) {
              const url = new URL(azuracastUrl)
              setServerInfo({
                host: url.hostname,
                port: 8000,
                mountPoint: '/radio.mp3',
                protocol: 'http',
              })
            }
          }
        }
      }
    } catch (err) {
      setError('Failed to load DJ accounts')
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCreate = async () => {
    if (!form.username || !form.displayName || !form.password) {
      setError('Please fill in all required fields')
      setTimeout(() => setError(null), 5000)
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      setTimeout(() => setError(null), 5000)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/streaming/dj-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (response.ok) {
        setAccounts([...accounts, data.data])
        setShowCreateModal(false)
        setForm({ username: '', displayName: '', password: '', userId: undefined })
        setSuccess('DJ account created successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to create DJ account')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create DJ account')
      setTimeout(() => setError(null), 5000)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/streaming/dj-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        setAccounts(accounts.map((a) => (a.id === id ? { ...a, isActive: !currentStatus } : a)))
        setSuccess(`DJ account ${!currentStatus ? 'activated' : 'deactivated'}`)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to update DJ account')
      }
    } catch (err) {
      setError('Failed to update DJ account')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete DJ account "${name}"?`)) return

    setDeleting(id)

    try {
      const response = await fetch(`/api/streaming/dj-accounts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAccounts(accounts.filter((a) => a.id !== id))
        setSuccess('DJ account deleted successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to delete DJ account')
      }
    } catch (err) {
      setError('Failed to delete DJ account')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm({ ...form, password })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading DJ accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl" />
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                DJ Accounts
              </h1>
              <p className="text-slate-400 text-lg">Manage live streamers and DJ credentials</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/streaming/go-live"
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300"
              >
                <Radio className="w-5 h-5" />
                Go Live
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                Add DJ Account
              </button>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mb-6 group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Radio className="w-5 h-5 text-purple-400" />
              <span>
                DJ accounts allow hosts to connect directly to the stream for live broadcasting.
                Share the streaming server details and credentials with your DJs.
              </span>
            </div>
          </div>
        </div>

        {/* Server Connection Details */}
        {serverInfo && (
          <div className="mb-8 group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                Streaming Server Connection Details
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                DJs need these details to connect using broadcasting software like OBS, BUTT, or Mixxx.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Server Host</label>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono">{serverInfo.host}</span>
                    <button
                      onClick={() => copyToClipboard(serverInfo.host, 'host')}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'host' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Port</label>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono">{serverInfo.port}</span>
                    <button
                      onClick={() => copyToClipboard(serverInfo.port.toString(), 'port')}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'port' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Mount Point</label>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono">{serverInfo.mountPoint}</span>
                    <button
                      onClick={() => copyToClipboard(serverInfo.mountPoint, 'mount')}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Copy"
                    >
                      {copiedField === 'mount' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Protocol</label>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-mono uppercase">{serverInfo.protocol}</span>
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-300">
                  <strong>Note:</strong> Each DJ uses their own username and password (set when creating the account above) to authenticate.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DJ Accounts Grid */}
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No DJ accounts created</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Create your first DJ account →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 overflow-hidden p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border backdrop-blur ${account.isActive ? 'bg-gradient-to-br from-purple-500/30 to-pink-600/30 border-purple-400/30' : 'bg-gradient-to-br from-slate-500/30 to-slate-600/30 border-slate-400/30'}`}>
                        <Mic className={`w-5 h-5 ${account.isActive ? 'text-purple-300' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{account.displayName}</h3>
                        <p className="text-sm text-slate-400 font-mono">@{account.username}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur whitespace-nowrap ${
                        account.isActive
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                          : 'bg-slate-500/30 text-slate-300 border border-slate-500/50'
                      }`}
                    >
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {account.user && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <User className="w-4 h-4" />
                      <span>Linked to: {account.user.name}</span>
                    </div>
                  )}

                  {account.lastConnectedAt && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Last connected: {new Date(account.lastConnectedAt).toLocaleString()}</span>
                    </div>
                  )}

                  {!account.lastConnectedAt && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <WifiOff className="w-4 h-4" />
                      <span>Never connected</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold ${
                        account.isActive
                          ? 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-300 border border-slate-500/30'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {account.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(account.id, account.displayName)}
                      disabled={deleting === account.id}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-300 text-sm font-semibold disabled:opacity-50"
                    >
                      {deleting === account.id ? (
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
              <Plus className="w-5 h-5 text-purple-400" />
              Create DJ Account
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="dj_username"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and underscores only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="DJ Display Name"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 pr-24 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-500"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-2 py-1 text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link to Team Member (Optional)
                </label>
                <select
                  value={form.userId || ''}
                  onChange={(e) => setForm({ ...form, userId: e.target.value || undefined })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white"
                >
                  <option value="" className="bg-slate-800">No link</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id} className="bg-slate-800">
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setForm({ username: '', displayName: '', password: '', userId: undefined })
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
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
