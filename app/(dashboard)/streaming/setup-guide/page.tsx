/**
 * DJ Software Setup Guide
 * Comprehensive instructions for connecting external DJ software to the station
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Download,
  Settings,
  Wifi,
  Music,
  Mic,
  Volume2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Headphones,
} from 'lucide-react'

interface ConnectionInfo {
  server: string
  port: string
  mount: string
}

const softwareGuides = [
  {
    id: 'mixxx',
    name: 'Mixxx',
    icon: '🎛️',
    description: 'Free, open-source DJ software with professional features',
    downloadUrl: 'https://mixxx.org/download/',
    difficulty: 'Beginner',
    platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      {
        title: 'Download and Install',
        content: 'Download Mixxx from mixxx.org and install it on your computer. It\'s completely free and open-source.',
      },
      {
        title: 'Open Preferences',
        content: 'Launch Mixxx and go to Options → Preferences (or press Ctrl+P on Windows/Linux, Cmd+, on Mac).',
      },
      {
        title: 'Configure Sound Hardware',
        content: 'In Sound Hardware settings, set Sound API to "Windows WASAPI" or "DirectSound". Select your speakers/headphones for Master Output.',
      },
      {
        title: 'Enable Live Broadcasting',
        content: 'Click on "Live Broadcasting" in the left menu. Check "Enable Live Broadcasting".',
      },
      {
        title: 'Enter Connection Details',
        content: 'Fill in the server connection details shown below. Make sure to select "Icecast 2" as the server type.',
        isConnectionStep: true,
      },
      {
        title: 'Configure Encoding',
        content: 'Set Format to MP3, Bitrate to 128 kbps, and Channels to Stereo for optimal quality.',
      },
      {
        title: 'Apply and Connect',
        content: 'Click Apply, then OK. In the main window, click the Broadcast button (microphone icon) to start streaming.',
      },
    ],
  },
  {
    id: 'butt',
    name: 'BUTT',
    icon: '🎙️',
    description: 'Broadcast Using This Tool - Simple, lightweight streaming app',
    downloadUrl: 'https://danielnoethen.de/butt/',
    difficulty: 'Beginner',
    platforms: ['Windows', 'macOS', 'Linux'],
    steps: [
      {
        title: 'Download and Install',
        content: 'Download BUTT from danielnoethen.de/butt and install it. It\'s a small, simple application perfect for beginners.',
      },
      {
        title: 'Open Settings',
        content: 'Launch BUTT and click the "Settings" button to open the configuration window.',
      },
      {
        title: 'Add New Server',
        content: 'In the "Main" tab, click "ADD" next to the Server dropdown to create a new server configuration.',
      },
      {
        title: 'Configure Server',
        content: 'Select "IceCast" as the server type. Enter the connection details shown below.',
        isConnectionStep: true,
      },
      {
        title: 'Set Audio Input',
        content: 'Go to the "Audio" tab and select your microphone or audio interface as the input device.',
      },
      {
        title: 'Configure Stream Settings',
        content: 'In the "Stream" tab, set Codec to MP3, Bitrate to 128 kbps, Samplerate to 44100 Hz.',
      },
      {
        title: 'Start Broadcasting',
        content: 'Click "Save" to save settings, then click the "Play" button in the main window to start streaming.',
      },
    ],
  },
  {
    id: 'virtualdj',
    name: 'Virtual DJ',
    icon: '💿',
    description: 'Professional DJ software with advanced mixing features',
    downloadUrl: 'https://www.virtualdj.com/download/',
    difficulty: 'Intermediate',
    platforms: ['Windows', 'macOS'],
    steps: [
      {
        title: 'Download and Install',
        content: 'Download Virtual DJ from virtualdj.com. The Home version is free for personal use.',
      },
      {
        title: 'Open Settings',
        content: 'Launch Virtual DJ and go to Settings (gear icon) → Options.',
      },
      {
        title: 'Find Broadcast Settings',
        content: 'Search for "broadcast" in the settings search bar, or navigate to the Broadcasting section.',
      },
      {
        title: 'Enable Broadcasting',
        content: 'Set "broadcastActive" to "Yes" to enable the broadcast feature.',
      },
      {
        title: 'Configure Server',
        content: 'Set the broadcast server type, host, port, and mount point using the details below.',
        isConnectionStep: true,
      },
      {
        title: 'Set Quality',
        content: 'Configure broadcastBitrate to 128 and ensure the format is set to MP3.',
      },
      {
        title: 'Start Broadcasting',
        content: 'Apply settings and use the Broadcast button in the interface to start streaming.',
      },
    ],
  },
]

export default function SetupGuidePage() {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    server: 'localhost',
    port: '8005',
    mount: '/',
  })
  const [expandedGuide, setExpandedGuide] = useState<string | null>('mixxx')
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [djCredentials, setDjCredentials] = useState<{ username: string; password: string } | null>(null)

  useEffect(() => {
    fetchConnectionInfo()
  }, [])

  const fetchConnectionInfo = async () => {
    try {
      const response = await fetch('/api/streaming/config')
      if (response.ok) {
        const data = await response.json()
        if (data.data?.azuracastUrl) {
          const url = new URL(data.data.azuracastUrl)
          setConnectionInfo({
            server: url.hostname,
            port: '8005',
            mount: '/',
          })
        }
      }

      // Fetch DJ accounts for sample credentials
      const djResponse = await fetch('/api/streaming/dj-accounts')
      if (djResponse.ok) {
        const djData = await djResponse.json()
        if (djData.data && djData.data.length > 0) {
          setDjCredentials({
            username: djData.data[0].username,
            password: '********',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch connection info:', error)
    } finally {
      setLoading(false)
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

  const renderConnectionDetails = () => (
    <div className="bg-slate-800/50 rounded-xl p-4 my-4 border border-slate-700">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Wifi className="w-4 h-4 text-emerald-400" />
        Your Connection Details
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Server / Host</p>
          <div className="flex items-center justify-between">
            <code className="text-emerald-400 font-mono text-sm">{connectionInfo.server}</code>
            <button
              onClick={() => copyToClipboard(connectionInfo.server, 'server')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {copied === 'server' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Port</p>
          <div className="flex items-center justify-between">
            <code className="text-emerald-400 font-mono text-sm">{connectionInfo.port}</code>
            <button
              onClick={() => copyToClipboard(connectionInfo.port, 'port')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {copied === 'port' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Mount Point</p>
          <div className="flex items-center justify-between">
            <code className="text-emerald-400 font-mono text-sm">{connectionInfo.mount}</code>
            <button
              onClick={() => copyToClipboard(connectionInfo.mount, 'mount')}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {copied === 'mount' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Type</p>
          <code className="text-emerald-400 font-mono text-sm">Icecast 2</code>
        </div>
        {djCredentials && (
          <>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Username</p>
              <code className="text-emerald-400 font-mono text-sm">{djCredentials.username}</code>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Password</p>
              <code className="text-slate-500 font-mono text-sm">Your DJ Password</code>
            </div>
          </>
        )}
      </div>
      <Link
        href="/streaming/dj-accounts"
        className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
      >
        View your DJ credentials →
      </Link>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading setup guide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/streaming/go-live"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Go Live
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            DJ Software Setup Guide
          </h1>
          <p className="text-slate-400 text-lg">
            Step-by-step instructions to connect your favorite DJ software to your station
          </p>
        </div>

        {/* Quick Connection Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
              <Wifi className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Quick Connection Reference</h2>
              <p className="text-slate-400 mb-4">
                Use these settings in any DJ software that supports Icecast streaming:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Server</p>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-400 font-mono">{connectionInfo.server}</code>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.server, 'quick-server')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === 'quick-server' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Port</p>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-400 font-mono">{connectionInfo.port}</code>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.port, 'quick-port')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === 'quick-port' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Mount</p>
                  <div className="flex items-center gap-2">
                    <code className="text-emerald-400 font-mono">{connectionInfo.mount}</code>
                    <button
                      onClick={() => copyToClipboard(connectionInfo.mount, 'quick-mount')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === 'quick-mount' ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Type</p>
                  <code className="text-emerald-400 font-mono">Icecast 2</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Software Guides */}
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Setup Instructions</h2>

          {softwareGuides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
            >
              {/* Guide Header */}
              <button
                onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{guide.icon}</span>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">{guide.name}</h3>
                    <p className="text-slate-400 text-sm">{guide.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        guide.difficulty === 'Beginner'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {guide.difficulty}
                      </span>
                      <span className="text-xs text-slate-500">
                        {guide.platforms.join(' • ')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={guide.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  {expandedGuide === guide.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Guide Steps */}
              {expandedGuide === guide.id && (
                <div className="px-6 pb-6 border-t border-white/10">
                  <div className="pt-6 space-y-4">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <span className="text-emerald-400 font-bold text-sm">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold mb-1">{step.title}</h4>
                          <p className="text-slate-400 text-sm">{step.content}</p>
                          {step.isConnectionStep && renderConnectionDetails()}
                        </div>
                      </div>
                    ))}

                    {/* Success indicator */}
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <p className="text-emerald-300 font-medium">You&apos;re all set!</p>
                          <p className="text-sm text-slate-400">
                            Once connected, your stream will be live and listeners can tune in immediately.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recommended Settings */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Recommended Stream Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Music className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium">Audio Format</p>
                  <p className="text-sm text-slate-400">MP3 (best compatibility)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-white font-medium">Bitrate</p>
                  <p className="text-sm text-slate-400">128 kbps (balanced quality)</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Volume2 className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-white font-medium">Sample Rate</p>
                  <p className="text-sm text-slate-400">44100 Hz (CD quality)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Headphones className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-white font-medium">Channels</p>
                  <p className="text-sm text-slate-400">Stereo (2 channels)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Troubleshooting
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-1">Can&apos;t connect to server?</h4>
              <p className="text-sm text-slate-400">
                Make sure you&apos;re using port 8005 (not 8000). Port 8000 is for listeners, port 8005 is for DJs.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-1">Authentication failed?</h4>
              <p className="text-sm text-slate-400">
                Double-check your DJ username and password. You can view your credentials in the{' '}
                <Link href="/streaming/dj-accounts" className="text-blue-400 hover:underline">
                  DJ Accounts
                </Link>{' '}
                section.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-1">Stream connects but no audio?</h4>
              <p className="text-sm text-slate-400">
                Check your audio input settings in the DJ software. Make sure the correct microphone or audio interface is selected.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="text-white font-medium mb-1">Frequent disconnections?</h4>
              <p className="text-sm text-slate-400">
                Check your internet connection stability. Try lowering the bitrate to 96kbps if you have a slow connection.
              </p>
            </div>
          </div>
        </div>

        {/* Need Help */}
        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-xl border border-blue-500/30">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Still Need Help?</h2>
              <p className="text-slate-300 mb-4">
                Our support team is here to help you get your DJ software connected and streaming.
                Don&apos;t hesitate to reach out if you&apos;re having trouble.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="mailto:support@rms.com?subject=DJ%20Software%20Setup%20Help"
                  className="inline-flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Email Support
                </a>
                <Link
                  href="/streaming/go-live"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  <Mic className="w-5 h-5" />
                  Back to Go Live
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
