/**
 * Go Live Page
 * Allows DJs to broadcast live using AzuraCast's Web DJ or external software
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Radio,
  ArrowLeft,
  Users,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Info,
  Headphones,
  Download,
  CheckCircle2,
  Music2,
  MessageCircle,
  BookOpen,
} from 'lucide-react'

interface StreamingConfig {
  id: string
  streamName: string
  azuracastStationId?: number
  streamUrl?: string
  isEnabled: boolean
  webDjUrl?: string
  azuracastUrl?: string
}

interface StreamingStatus {
  isOnline: boolean
  isLive: boolean
  currentListeners: number
  liveDj?: {
    name: string
    connectedAt: string
  }
}

const externalSoftware = [
  {
    name: 'BUTT',
    description: 'Broadcast Using This Tool - Simple and free',
    url: 'https://danielnoethen.de/butt/',
    icon: '🎙️',
  },
  {
    name: 'Mixxx',
    description: 'Free DJ software with broadcasting',
    url: 'https://mixxx.org/',
    icon: '🎛️',
  },
  {
    name: 'Virtual DJ',
    description: 'Professional DJ software',
    url: 'https://www.virtualdj.com/',
    icon: '💿',
  },
]

export default function GoLivePage() {
  const [config, setConfig] = useState<StreamingConfig | null>(null)
  const [status, setStatus] = useState<StreamingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [webDjUrl, setWebDjUrl] = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showIframe, setShowIframe] = useState(false)

  useEffect(() => {
    fetchData()
    // Refresh status every 10 seconds
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [configRes, statusRes] = await Promise.all([
        fetch('/api/streaming/config'),
        fetch('/api/streaming/status'),
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData.data)

        // Use Web DJ URL from API
        if (configData.data?.webDjUrl) {
          setWebDjUrl(configData.data.webDjUrl)
        }
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        // Map API response to expected interface
        const apiData = statusData.data
        setStatus({
          isOnline: apiData.isOnline,
          isLive: apiData.live?.isLive || false,
          currentListeners: apiData.listeners?.current || 0,
          liveDj: apiData.live?.isLive ? {
            name: apiData.live?.streamerName || 'Live DJ',
            connectedAt: new Date().toISOString(),
          } : undefined,
        })
      }
    } catch (err) {
      console.error('Failed to load streaming data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/streaming/status')
      if (response.ok) {
        const data = await response.json()
        // Map API response to expected interface
        const apiData = data.data
        setStatus({
          isOnline: apiData.isOnline,
          isLive: apiData.live?.isLive || false,
          currentListeners: apiData.listeners?.current || 0,
          liveDj: apiData.live?.isLive ? {
            name: apiData.live?.streamerName || 'Live DJ',
            connectedAt: new Date().toISOString(),
          } : undefined,
        })
      }
    } catch (err) {
      console.error('Failed to fetch status:', err)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading Go Live...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen p-8">
        <Link
          href="/streaming"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Streaming
        </Link>
        <div className="max-w-md mx-auto mt-16 text-center">
          <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Streaming Not Configured</h2>
          <p className="text-slate-400 mb-6">
            Please configure your streaming settings first before going live.
          </p>
          <Link
            href="/streaming/settings"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            Configure Streaming
          </Link>
        </div>
      </div>
    )
  }

  // Render content based on whether DJ is live via external software
  const renderMainPanel = () => {
    // DJ is live via external software (Mixxx, BUTT, etc.)
    if (status?.isLive) {
      return (
        <div className="p-8">
          <div className="max-w-lg mx-auto text-center">
            {/* Live Animation */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500/30 to-orange-600/30 rounded-full flex items-center justify-center mx-auto border-2 border-red-400/50 animate-pulse">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500/50 to-orange-600/50 rounded-full flex items-center justify-center">
                  <Mic className="w-12 h-12 text-red-400" />
                </div>
              </div>
              {/* Pulsing rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-40 border-2 border-red-400/30 rounded-full animate-ping" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-semibold">LIVE NOW</span>
            </div>

            <h3 className="text-3xl font-bold text-white mb-2">
              {status.liveDj?.name || 'DJ'} is Broadcasting
            </h3>
            <p className="text-slate-400 mb-6">
              Connected via external DJ software
            </p>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{status.currentListeners}</p>
                <p className="text-sm text-slate-400">Listeners</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                <Music2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">Live</p>
                <p className="text-sm text-slate-400">Stream Status</p>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm text-left">
                  Your broadcast is live and reaching your audience.
                  AutoDJ will automatically resume when you disconnect.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {webDjUrl && (
                <a
                  href={webDjUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Web DJ
                </a>
              )}
              <Link
                href="/streaming"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <Radio className="w-4 h-4" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Not live - show Web DJ options
    if (webDjUrl) {
      return (
        <div>
          {/* Toggle between iframe and launch button */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowIframe(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !showIframe
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Quick Launch
              </button>
              <button
                onClick={() => setShowIframe(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showIframe
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Embedded Console
              </button>
            </div>
            <a
              href={webDjUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </a>
          </div>

          {showIframe ? (
            <div className="relative" style={{ height: '550px' }}>
              <iframe
                src={webDjUrl}
                className="w-full h-full border-0"
                allow="microphone"
                title="AzuraCast Web DJ"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-200 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    If you experience connection issues, try{' '}
                    <a href={webDjUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      opening in a new tab
                    </a>{' '}
                    or use external DJ software.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500/30 to-orange-600/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-400/30">
                  <Mic className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Go Live?</h3>
                <p className="text-slate-400 mb-6">
                  Click the button below to open the AzuraCast Web DJ in a new tab,
                  or switch to &quot;Embedded Console&quot; to broadcast from here.
                </p>
                <a
                  href={webDjUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 text-lg"
                >
                  <Radio className="w-6 h-6" />
                  Launch Web DJ
                  <ExternalLink className="w-5 h-5" />
                </a>
                <p className="text-sm text-slate-500 mt-4">
                  Use your DJ credentials to log in and start streaming
                </p>
              </div>
            </div>
          )}
        </div>
      )
    }

    // No Web DJ URL
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">
          Web DJ URL not available. Please ensure your station is properly configured in AzuraCast.
        </p>
        <p className="text-sm text-slate-500">
          You can still use external DJ software to broadcast.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
                Go Live
              </h1>
              <p className="text-slate-400 text-lg">Broadcast live to your listeners</p>
            </div>

            {/* Live Status Indicator */}
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${
              status?.isLive
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : status?.isOnline
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-500/20 border-slate-500/50 text-slate-400'
            }`}>
              {status?.isLive ? (
                <>
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="font-semibold">LIVE</span>
                </>
              ) : status?.isOnline ? (
                <>
                  <Wifi className="w-5 h-5" />
                  <span>AutoDJ Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500/30 to-cyan-600/30 p-2 rounded-lg border border-blue-400/30">
                <Users className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{status?.currentListeners || 0}</p>
                <p className="text-sm text-slate-400">Current Listeners</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border ${
                status?.isLive
                  ? 'bg-gradient-to-br from-red-500/30 to-orange-600/30 border-red-400/30'
                  : 'bg-gradient-to-br from-slate-500/30 to-slate-600/30 border-slate-400/30'
              }`}>
                {status?.isLive ? (
                  <Mic className="w-5 h-5 text-red-300" />
                ) : (
                  <MicOff className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {status?.isLive ? status.liveDj?.name || 'Live DJ' : 'Not Broadcasting'}
                </p>
                <p className="text-sm text-slate-400">
                  {status?.isLive && status.liveDj?.connectedAt
                    ? `Since ${new Date(status.liveDj.connectedAt).toLocaleTimeString()}`
                    : 'DJ Status'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-500/30 to-pink-600/30 p-2 rounded-lg border border-purple-400/30">
                <Radio className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <p className="text-lg font-bold text-white truncate">{config.streamName}</p>
                <p className="text-sm text-slate-400">Station</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Web DJ Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-red-400" />
                  {status?.isLive ? 'Live Broadcast' : 'Web DJ Console'}
                </h2>
              </div>
              {renderMainPanel()}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Connection Info */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-orange-400" />
                  Connection Info
                </h3>
                <button
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {showCredentials ? 'Hide' : 'Show'}
                </button>
              </div>

              {showCredentials ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400">Server</p>
                      <p className="text-sm text-white font-mono">
                        {config?.azuracastUrl?.replace(/https?:\/\//, '').replace(/:.*/, '') || 'localhost'}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(
                        config?.azuracastUrl?.replace(/https?:\/\//, '').replace(/:.*/, '') || 'localhost',
                        'server'
                      )}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'server' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400">Port</p>
                      <p className="text-sm text-white font-mono">8005</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard('8005', 'port')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'port' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-xs text-slate-400">Mount</p>
                      <p className="text-sm text-white font-mono">/</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard('/', 'mount')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied === 'mount' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Link
                      href="/streaming/dj-accounts"
                      className="text-sm text-orange-400 hover:text-orange-300 transition-colors block"
                    >
                      View DJ credentials →
                    </Link>
                    <Link
                      href="/streaming/setup-guide"
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      Setup Guide →
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Click &quot;Show&quot; to view connection details for external DJ software.
                </p>
              )}
            </div>

            {/* Tips */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-blue-400" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Allow microphone access when prompted
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Use headphones to prevent feedback
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  Test your audio levels before going live
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  AutoDJ will resume when you disconnect
                </li>
              </ul>
            </div>

            {/* External Software */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-emerald-400" />
                External Software
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                For advanced features, use professional DJ software:
              </p>
              <div className="space-y-3">
                {externalSoftware.map((software) => (
                  <a
                    key={software.name}
                    href={software.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                  >
                    <span className="text-2xl">{software.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium group-hover:text-emerald-300 transition-colors">
                        {software.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{software.description}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </a>
                ))}
              </div>
              <Link
                href="/streaming/setup-guide"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                View Setup Guide
              </Link>
            </div>

            {/* Need Help? */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                Need Help?
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                Having trouble setting up? Our team is here to help you get started with live broadcasting.
              </p>
              <a
                href="mailto:support@rms.com?subject=DJ%20Broadcasting%20Help"
                className="flex items-center justify-center gap-2 w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
