/**
 * Admin Streaming Management Page
 * Manage AzuraCast server and organization streaming
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Wifi,
  Server,
  Users,
  Radio,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Play,
  Pause,
  Settings,
  Building2,
  ListMusic,
  Mic,
  Activity,
  Zap,
  Link2,
  Unlink,
} from 'lucide-react'

interface StreamingConfig {
  id: string
  streamName: string
  streamUrl: string | null
  status: string
  isEnabled: boolean
  azuracastStationId: number | null
  organization: {
    id: string
    name: string
    slug: string
    status: string
  }
  _count: {
    mountPoints: number
    djAccounts: number
    playlists: number
  }
}

interface AzuracastStatus {
  online: boolean
  url: string
  stations: Array<{
    id: number
    name: string
    is_online: boolean
    listeners: number
    linkedOrgId: string | null
  }>
}

interface AvailableOrganization {
  id: string
  name: string
  slug: string
  status: string
}

interface Stats {
  totalConfigs: number
  activeStreams: number
  totalListeners: number
  totalMountPoints: number
  totalDJAccounts: number
  totalPlaylists: number
}

export default function AdminStreamingPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [azuracast, setAzuracast] = useState<AzuracastStatus | null>(null)
  const [configs, setConfigs] = useState<StreamingConfig[]>([])
  const [availableOrgs, setAvailableOrgs] = useState<AvailableOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [linkingStation, setLinkingStation] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/streaming')

      if (!response.ok) {
        if (response.status === 401) {
          setError('Developer access required')
          return
        }
        throw new Error('Failed to fetch data')
      }

      const data = await response.json()
      setStats(data.stats)
      setAzuracast(data.azuracast)
      setConfigs(data.configs)
      setAvailableOrgs(data.availableOrganizations || [])
    } catch (err) {
      setError('Failed to load streaming data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAction = async (action: string, params: Record<string, unknown> = {}) => {
    setActionLoading(action)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Action failed'
        throw new Error(errorMessage)
      }

      setSuccess(data.message || 'Action completed successfully')
      setTimeout(() => setSuccess(null), 5000)

      // Refresh data
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
      setTimeout(() => setError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLinkStation = async (stationId: number, organizationId: string) => {
    setActionLoading(`link_${stationId}`)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/admin/streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link_station', stationId, organizationId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link station')
      }

      setSuccess(data.message || 'Station linked successfully')
      setLinkingStation(null)
      setTimeout(() => setSuccess(null), 5000)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link station')
      setTimeout(() => setError(null), 5000)
    } finally {
      setActionLoading(null)
    }
  }

  // Get organization name by ID
  const getOrgName = (orgId: string) => {
    const config = configs.find(c => c.organization.id === orgId)
    return config?.organization.name || 'Unknown'
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading streaming management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Streaming Management</h1>
            <p className="text-slate-400">Manage AzuraCast server and organization streams</p>
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-slate-300 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">×</button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-300 hover:text-emerald-200">×</button>
        </div>
      )}

      {/* AzuraCast Server Status */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          AzuraCast Server
        </h2>

        {azuracast?.url === 'Not configured' ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium mb-1">AzuraCast Not Configured</p>
                <p className="text-sm text-amber-200/80">
                  To enable streaming management, add the following environment variables:
                </p>
                <div className="mt-2 bg-black/30 rounded p-3 font-mono text-xs text-slate-300">
                  <div>AZURACAST_URL=https://your-azuracast-server.com</div>
                  <div>AZURACAST_API_KEY=your-api-key-here</div>
                </div>
                <p className="text-xs text-amber-200/60 mt-2">
                  Organizations can still configure their streaming settings, but station provisioning requires a connected AzuraCast server.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${azuracast?.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <div>
                <p className="text-white font-medium">
                  {azuracast?.online ? 'Server Online' : 'Server Offline'}
                </p>
                <p className="text-sm text-slate-400 font-mono">{azuracast?.url}</p>
              </div>
            </div>
            <button
              onClick={() => handleAction('sync_stations')}
              disabled={actionLoading === 'sync_stations' || !azuracast?.online}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 rounded-lg text-cyan-300 transition-all disabled:opacity-50"
            >
              {actionLoading === 'sync_stations' ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Sync Stations
            </button>
          </div>
        )}

        {/* AzuraCast Stations */}
        {azuracast?.stations && azuracast.stations.length > 0 && (
          <div className="border-t border-white/10 pt-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Stations ({azuracast.stations.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {azuracast.stations.map((station) => (
                <div
                  key={station.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${station.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      <div>
                        <p className="text-white font-medium">{station.name}</p>
                        <p className="text-xs text-slate-400">Station ID: {station.id} • {station.listeners} listeners</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAction('restart_station', { stationId: station.id })}
                      disabled={!!actionLoading}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors rounded hover:bg-white/10"
                      title="Restart station"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Linked Organization or Link Option */}
                  <div className="border-t border-white/10 pt-3">
                    {station.linkedOrgId ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Link2 className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-300">Linked to:</span>
                          <span className="text-emerald-300 font-medium">{getOrgName(station.linkedOrgId)}</span>
                        </div>
                        <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">Connected</span>
                      </div>
                    ) : (
                      <div>
                        {linkingStation === station.id ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-400 mb-2">Select organization to link:</p>
                            <select
                              className="w-full px-3 py-2 bg-slate-800 border border-white/20 rounded-lg text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleLinkStation(station.id, e.target.value)
                                }
                              }}
                              disabled={!!actionLoading}
                              defaultValue=""
                            >
                              <option value="" disabled>Choose organization...</option>
                              {availableOrgs.map((org) => (
                                <option key={org.id} value={org.id}>
                                  {org.name} ({org.status})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => setLinkingStation(null)}
                              className="text-xs text-slate-400 hover:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Unlink className="w-4 h-4" />
                              <span>Not linked to any organization</span>
                            </div>
                            <button
                              onClick={() => setLinkingStation(station.id)}
                              disabled={availableOrgs.length === 0}
                              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Link2 className="w-3 h-3" />
                              Link Organization
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Info about available orgs */}
            {availableOrgs.length === 0 && azuracast.stations.some(s => !s.linkedOrgId) && (
              <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                No organizations available to link. All active organizations already have streaming configured.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Radio className="w-4 h-4" />
              <span className="text-xs font-medium">Total Configs</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalConfigs}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">Active Streams</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeStreams}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Total Listeners</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalListeners}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium">Mount Points</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalMountPoints}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-pink-400 mb-2">
              <Mic className="w-4 h-4" />
              <span className="text-xs font-medium">DJ Accounts</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalDJAccounts}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <ListMusic className="w-4 h-4" />
              <span className="text-xs font-medium">Playlists</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalPlaylists}</p>
          </div>
        </div>
      )}

      {/* Organization Streaming Configs */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-purple-400" />
          Organization Streaming Configs
        </h2>

        {configs.length === 0 ? (
          <div className="text-center py-8">
            <Radio className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">No streaming configurations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Organization</th>
                  <th className="pb-3 font-medium">Station Name</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">AzuraCast ID</th>
                  <th className="pb-3 font-medium">Resources</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {configs.map((config) => (
                  <tr key={config.id} className="text-sm">
                    <td className="py-4">
                      <div>
                        <p className="text-white font-medium">{config.organization.name}</p>
                        <p className="text-xs text-slate-400">{config.organization.slug}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="text-white">{config.streamName}</p>
                      {config.streamUrl && (
                        <p className="text-xs text-slate-400 font-mono truncate max-w-48">{config.streamUrl}</p>
                      )}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          config.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : config.status === 'OFFLINE'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                        }`}
                      >
                        {config.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {config.status}
                      </span>
                    </td>
                    <td className="py-4 text-slate-300 font-mono">
                      {config.azuracastStationId || '-'}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{config._count.mountPoints} mounts</span>
                        <span>{config._count.djAccounts} DJs</span>
                        <span>{config._count.playlists} playlists</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {config.azuracastStationId && (
                          <button
                            onClick={() => handleAction('restart_station', { stationId: config.azuracastStationId })}
                            disabled={!!actionLoading}
                            className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Restart station"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleAction(config.isEnabled ? 'disable_streaming' : 'enable_streaming', {
                              organizationId: config.organization.id,
                            })
                          }
                          disabled={!!actionLoading}
                          className={`p-2 transition-colors ${
                            config.isEnabled
                              ? 'text-emerald-400 hover:text-red-400'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                          title={config.isEnabled ? 'Disable streaming' : 'Enable streaming'}
                        >
                          {config.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleAction('sync_stations')}
            disabled={!!actionLoading || azuracast?.url === 'Not configured'}
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-white font-medium">Sync All Stations</p>
              <p className="text-xs text-slate-400">
                {azuracast?.url === 'Not configured' ? 'Configure AzuraCast first' : 'Update database from AzuraCast'}
              </p>
            </div>
          </button>
          {azuracast?.url && azuracast.url !== 'Not configured' ? (
            <a
              href={azuracast.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
            >
              <Server className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white font-medium">Open AzuraCast</p>
                <p className="text-xs text-slate-400">Access server admin panel</p>
              </div>
            </a>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl opacity-50">
              <Server className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-400 font-medium">Open AzuraCast</p>
                <p className="text-xs text-slate-500">Not configured</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
            <Settings className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-white font-medium">Environment</p>
              <p className="text-xs text-slate-400 font-mono">
                {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
