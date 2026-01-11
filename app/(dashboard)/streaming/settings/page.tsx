/**
 * Streaming Settings Page
 * Simple user-friendly settings for stream configuration
 * Note: AzuraCast is managed by the platform provider
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  Save,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Music,
  Users,
  HardDrive,
  Gauge,
} from 'lucide-react'

interface StreamingConfig {
  id?: string
  streamName?: string
  streamDescription?: string
  streamGenre?: string
  streamUrl?: string
  isEnabled: boolean
  status?: string
}

interface PlanLimits {
  maxListeners?: number
  storageGB?: number
  maxBitrate?: number
  maxPlaylists?: number
  analyticsRetentionDays?: number
  customBranding?: boolean
}

export default function StreamingSettingsPage() {
  const [config, setConfig] = useState<StreamingConfig>({
    streamName: '',
    streamDescription: '',
    streamGenre: '',
    isEnabled: false,
  })
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isNewSetup, setIsNewSetup] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/streaming/config')
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setConfig(data.data)
            setIsNewSetup(false)
          } else {
            setIsNewSetup(true)
          }
          if (data.planLimits) {
            setPlanLimits(data.planLimits)
          }
        } else if (response.status === 403) {
          setError('Streaming is not available on your current plan. Please upgrade to access this feature.')
        }
      } catch (err) {
        console.error('Failed to fetch config:', err)
        setError('Failed to load streaming settings')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  const handleActivateStreaming = async () => {
    if (!config.streamName) {
      setError('Please enter a station name')
      setTimeout(() => setError(null), 5000)
      return
    }

    setActivating(true)
    setError(null)

    try {
      const response = await fetch('/api/streaming/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationName: config.streamName,
          stationDescription: config.streamDescription,
          genre: config.streamGenre,
          timezone: 'Africa/Accra',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data.data)
        setIsNewSetup(false)
        setSuccess('Streaming has been activated! Your station is now being set up.')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to activate streaming')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate streaming')
      setTimeout(() => setError(null), 5000)
    } finally {
      setActivating(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/streaming/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationName: config.streamName,
          stationDescription: config.streamDescription,
          genre: config.streamGenre,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setConfig(data.data)
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                {isNewSetup ? 'Activate Streaming' : 'Streaming Settings'}
              </h1>
              <p className="text-slate-400 text-lg">
                {isNewSetup
                  ? 'Set up your internet radio stream'
                  : 'Configure your station details'}
              </p>
            </div>
          </div>
        </div>

        {/* Plan Limits Card */}
        {planLimits && (
          <div className="mb-6 group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-cyan-600/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Your Plan Includes:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{planLimits.maxListeners || 'Unlimited'} listeners</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <HardDrive className="w-4 h-4 text-blue-400" />
                  <span>{planLimits.storageGB || 0} GB storage</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Gauge className="w-4 h-4 text-purple-400" />
                  <span>{planLimits.maxBitrate || 128} kbps max</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Music className="w-4 h-4 text-pink-400" />
                  <span>{planLimits.maxPlaylists || 'Unlimited'} playlists</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Station Information Form */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              Station Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Station Name *
                </label>
                <input
                  type="text"
                  value={config.streamName || ''}
                  onChange={(e) => setConfig({ ...config, streamName: e.target.value })}
                  placeholder="e.g., Radio Ghana Live"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300"
                />
                <p className="text-xs text-slate-500 mt-1">This name will be shown to your listeners</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={config.streamDescription || ''}
                  onChange={(e) => setConfig({ ...config, streamDescription: e.target.value })}
                  placeholder="Tell listeners about your station..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  value={config.streamGenre || ''}
                  onChange={(e) => setConfig({ ...config, streamGenre: e.target.value })}
                  placeholder="e.g., Talk Radio, Highlife, Gospel, News"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300"
                />
              </div>

              {/* Show stream URL if already configured */}
              {!isNewSetup && config.streamUrl && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Stream URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={config.streamUrl}
                      readOnly
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(config.streamUrl || '')
                        setSuccess('Stream URL copied!')
                        setTimeout(() => setSuccess(null), 3000)
                      }}
                      className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Share this URL with your listeners</p>
                </div>
              )}
            </div>

            {/* Status (for existing configs) */}
            {!isNewSetup && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${config.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    <div>
                      <p className="text-white font-medium">
                        Status: {config.status === 'ACTIVE' ? 'Online' : config.status || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {config.isEnabled ? 'Streaming is enabled' : 'Streaming is disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          {isNewSetup ? (
            <button
              onClick={handleActivateStreaming}
              disabled={activating || !config.streamName}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {activating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Radio className="w-5 h-5" />
              )}
              {activating ? 'Activating...' : 'Activate Streaming'}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">How it works</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>1. Enter your station details and activate streaming</li>
            <li>2. Your stream will be automatically set up and ready within minutes</li>
            <li>3. Use the DJ Accounts feature to allow hosts to broadcast live</li>
            <li>4. Create playlists for AutoDJ to play when no one is live</li>
            <li>5. Share your stream URL with listeners</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
