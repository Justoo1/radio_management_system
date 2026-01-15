/**
 * Streaming Dashboard Page
 * Overview of streaming status, listeners, and controls
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Radio,
  Users,
  Activity,
  Settings,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Music,
  Mic,
  ListMusic,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Clock,
  ArrowUpRight,
  Loader,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  CalendarClock,
} from 'lucide-react'

interface StreamingStatus {
  isOnline: boolean
  isLive: boolean
  currentListeners: number
  peakListeners: number
  uniqueListeners: number
  nowPlaying: {
    title: string
    artist: string
    album?: string
    art?: string
    elapsed?: number
    duration?: number
  } | null
  liveDj?: {
    name: string
    connectedAt: string
  }
  streamUrl?: string
}

interface StreamingConfig {
  id: string
  streamName: string
  streamDescription?: string
  streamGenre?: string
  streamUrl?: string
  isEnabled: boolean
  status: string
  azuracastStationId?: number
  organizationSlug?: string
}

interface QuickStat {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  href?: string
}

interface AirtimeStats {
  total: number
  pendingReview: number
  approved: number
  live: number
}

export default function StreamingDashboardPage() {
  const [status, setStatus] = useState<StreamingStatus | null>(null)
  const [config, setConfig] = useState<StreamingConfig | null>(null)
  const [airtimeStats, setAirtimeStats] = useState<AirtimeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getPublicStreamUrl = () => {
    if (typeof window === 'undefined' || !organizationSlug) return ''
    return `${window.location.origin}/stream/${organizationSlug}`
  }

  const handleCopyUrl = async () => {
    const url = getPublicStreamUrl()
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, configRes, airtimeRes] = await Promise.all([
        fetch('/api/streaming/status'),
        fetch('/api/streaming/config'),
        fetch('/api/airtime/bookings?limit=1'),
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setStatus(statusData.data)
      }

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData.data)
        // Get organization slug from config response
        if (configData.data?.organizationSlug) {
          setOrganizationSlug(configData.data.organizationSlug)
        }
      } else if (configRes.status === 404) {
        // No streaming config yet
        setConfig(null)
      }

      // Fetch airtime stats
      if (airtimeRes.ok) {
        const airtimeData = await airtimeRes.json()
        setAirtimeStats({
          total: airtimeData.total || 0,
          pendingReview: airtimeData.stats?.byStatus?.PENDING_REVIEW || 0,
          approved: airtimeData.stats?.byStatus?.APPROVED || 0,
          live: airtimeData.stats?.byStatus?.LIVE || 0,
        })
      }
    } catch (err) {
      console.error('Failed to fetch streaming data:', err)
      setError('Failed to load streaming data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handlePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    if (!config?.streamUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setIsAudioLoading(true)
      audioRef.current.src = config.streamUrl
      audioRef.current.load()
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          setIsAudioLoading(false)
        })
        .catch((err) => {
          console.error('Playback failed:', err)
          setIsAudioLoading(false)
          setError('Failed to play stream. Try opening the public player instead.')
          setTimeout(() => setError(null), 5000)
        })
    }
  }

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleControl = async (action: 'restart' | 'skip') => {
    try {
      const response = await fetch('/api/streaming/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Control action failed')
      }

      // Refresh status after action
      setTimeout(fetchData, 2000)
    } catch (err) {
      setError(`Failed to ${action} stream`)
      setTimeout(() => setError(null), 5000)
    }
  }

  const quickStats: QuickStat[] = [
    {
      label: 'Current Listeners',
      value: status?.currentListeners || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
    },
    {
      label: 'Peak Listeners',
      value: status?.peakListeners || 0,
      icon: <ArrowUpRight className="w-6 h-6" />,
      color: 'purple',
    },
    {
      label: 'Unique Listeners',
      value: status?.uniqueListeners || 0,
      icon: <Activity className="w-6 h-6" />,
      color: 'emerald',
    },
    {
      label: 'Stream Status',
      value: status?.isOnline ? 'Online' : 'Offline',
      icon: status?.isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />,
      color: status?.isOnline ? 'emerald' : 'red',
    },
  ]

  const quickActions = [
    {
      label: 'Go Live',
      description: 'Broadcast live now',
      icon: <Mic className="w-5 h-5" />,
      href: '/streaming/go-live',
      color: 'red',
    },
    {
      label: 'Airtime Bookings',
      description: 'Manage guest broadcast requests',
      icon: <CalendarClock className="w-5 h-5" />,
      href: '/streaming/airtime',
      color: 'amber',
    },
    {
      label: 'Mount Points',
      description: 'Manage stream endpoints',
      icon: <Radio className="w-5 h-5" />,
      href: '/streaming/mount-points',
      color: 'blue',
    },
    {
      label: 'DJ Accounts',
      description: 'Manage DJ credentials',
      icon: <Users className="w-5 h-5" />,
      href: '/streaming/dj-accounts',
      color: 'purple',
    },
    {
      label: 'Playlists',
      description: 'AutoDJ playlists',
      icon: <ListMusic className="w-5 h-5" />,
      href: '/streaming/playlists',
      color: 'pink',
    },
    {
      label: 'Settings',
      description: 'Stream configuration',
      icon: <Settings className="w-5 h-5" />,
      href: '/streaming/settings',
      color: 'slate',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading streaming dashboard...</p>
        </div>
      </div>
    )
  }

  // No streaming config - show setup prompt but still allow airtime access
  if (!config) {
    return (
      <div className="min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Streaming
            </h1>
            <p className="text-slate-400 text-lg">Configure your internet radio stream</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mt-8">
            {/* Streaming Setup Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center h-full flex flex-col">
                <div className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 p-4 rounded-xl border border-cyan-400/30 backdrop-blur w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-cyan-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Set Up Streaming</h2>
                <p className="text-slate-400 mb-8 flex-1">
                  Connect your radio station to AzuraCast to enable internet streaming, manage playlists, and track listener analytics.
                </p>
                <Link
                  href="/streaming/settings"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  <Settings className="w-5 h-5" />
                  Configure Streaming
                </Link>
              </div>
            </div>

            {/* Airtime Bookings Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center h-full flex flex-col">
                <div className="bg-gradient-to-br from-amber-500/30 to-orange-600/30 p-4 rounded-xl border border-amber-400/30 backdrop-blur w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <CalendarClock className="w-8 h-8 text-amber-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Airtime Bookings</h2>
                <p className="text-slate-400 mb-8 flex-1">
                  Allow guests to book airtime for preaching, advertising, or other broadcasts. Manage packages, approve bookings, and track payments.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/streaming/airtime/packages"
                    className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-300 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                  >
                    Manage Packages
                  </Link>
                  <Link
                    href="/streaming/airtime"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300"
                  >
                    <CalendarClock className="w-5 h-5" />
                    View Bookings
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200 text-lg font-semibold">
              ×
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Streaming
              </h1>
              <p className="text-slate-400 text-lg">{config.streamName || 'Your Internet Radio Stream'}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <Link
                href="/streaming/settings"
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div key={index} className="group relative">
              <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-600/20 to-${stat.color}-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-${stat.color}-500/50 transition-all duration-300`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`bg-gradient-to-br from-${stat.color}-500/30 to-${stat.color}-600/30 p-3 rounded-xl border border-${stat.color}-400/30 backdrop-blur`}>
                    <span className={`text-${stat.color}-300`}>{stat.icon}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Public Stream Link */}
        {organizationSlug && (
          <div className="group relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-pink-500/50 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-pink-500/30 to-purple-600/30 p-3 rounded-xl border border-pink-400/30 backdrop-blur">
                    <LinkIcon className="w-6 h-6 text-pink-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Public Stream Link</h3>
                    <p className="text-sm text-slate-400">Share this link with your listeners</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 md:max-w-xl">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-slate-300 truncate">
                    {getPublicStreamUrl()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600/40 to-purple-600/40 hover:from-pink-600/60 hover:to-purple-600/60 text-pink-200 rounded-xl border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300 font-semibold whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <Link
                      href={`/stream/${organizationSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Now Playing Card */}
          <div className="lg:col-span-2 group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-cyan-500/50 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Music className="w-5 h-5 text-cyan-400" />
                Now Playing
              </h2>

              {status?.isLive && status.liveDj ? (
                <div className="flex items-center gap-4 mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-white font-semibold">Live DJ: {status.liveDj.name}</p>
                    <p className="text-sm text-slate-400">
                      Connected since {new Date(status.liveDj.connectedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ) : null}

              {status?.nowPlaying ? (
                <div className="flex gap-6">
                  {status.nowPlaying.art && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
                      <img
                        src={status.nowPlaying.art}
                        alt="Album art"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white truncate">{status.nowPlaying.title}</h3>
                    <p className="text-lg text-slate-300 truncate">{status.nowPlaying.artist}</p>
                    {status.nowPlaying.album && (
                      <p className="text-sm text-slate-400 truncate mt-1">{status.nowPlaying.album}</p>
                    )}

                    {status.nowPlaying.duration && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {Math.floor((status.nowPlaying.elapsed || 0) / 60)}:
                            {String((status.nowPlaying.elapsed || 0) % 60).padStart(2, '0')} /{' '}
                            {Math.floor(status.nowPlaying.duration / 60)}:
                            {String(status.nowPlaying.duration % 60).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                            style={{
                              width: `${((status.nowPlaying.elapsed || 0) / status.nowPlaying.duration) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Volume2 className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400">No track currently playing</p>
                </div>
              )}

              {/* Stream Controls */}
              <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => handleControl('skip')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip Track
                </button>
                <button
                  onClick={() => handleControl('restart')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  Restart Stream
                </button>

                {/* Inline Audio Player Controls */}
                {config.streamUrl && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={handlePlayPause}
                      disabled={isAudioLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 rounded-xl text-cyan-300 transition-all duration-300 disabled:opacity-50"
                    >
                      {isAudioLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      {isAudioLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Listen Live'}
                    </button>

                    {isPlaying && (
                      <button
                        onClick={handleMuteToggle}
                        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}

                    {organizationSlug && (
                      <Link
                        href={`/stream/${organizationSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-xl text-purple-300 transition-all duration-300"
                        title="Share this link with your listeners"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Player
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 to-pink-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`block px-4 py-3 bg-gradient-to-r from-${action.color}-600/30 to-${action.color}-700/30 hover:from-${action.color}-600/50 hover:to-${action.color}-700/50 text-${action.color}-200 rounded-xl border border-${action.color}-500/30 hover:border-${action.color}-400/50 transition-all duration-300`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-${action.color}-300`}>{action.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{action.label}</p>
                        <p className="text-xs text-slate-400">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Airtime Bookings Section */}
        <div className="group relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-amber-500/50 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-amber-500/30 to-orange-600/30 p-3 rounded-xl border border-amber-400/30 backdrop-blur">
                  <CalendarClock className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Airtime Bookings</h3>
                  <p className="text-sm text-slate-400">Manage guest broadcast requests and packages</p>
                </div>
              </div>

              {/* Airtime Stats */}
              <div className="flex flex-wrap items-center gap-4">
                {airtimeStats && airtimeStats.pendingReview > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-300 font-medium">
                      {airtimeStats.pendingReview} Pending Review
                    </span>
                  </div>
                )}
                {airtimeStats && airtimeStats.live > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-300 font-medium">
                      {airtimeStats.live} Live Now
                    </span>
                  </div>
                )}
                {airtimeStats && (
                  <span className="text-sm text-slate-400">
                    {airtimeStats.total} total bookings
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href="/streaming/airtime/packages"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
                >
                  Manage Packages
                </Link>
                <Link
                  href="/streaming/airtime"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-600/40 to-orange-600/40 hover:from-amber-600/60 hover:to-orange-600/60 text-amber-200 rounded-xl border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 font-semibold"
                >
                  View Bookings
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Link */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-emerald-500/50 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500/30 to-cyan-600/30 p-3 rounded-xl border border-emerald-400/30 backdrop-blur">
                  <BarChart3 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Streaming Analytics</h3>
                  <p className="text-sm text-slate-400">View detailed listener metrics and trends</p>
                </div>
              </div>
              <Link
                href="/listeners"
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-600/60 hover:to-cyan-600/60 text-emerald-200 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 font-semibold"
              >
                View Analytics
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
