'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Radio,
  Clock,
  User,
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  Info,
  Timer,
  ArrowLeft,
} from 'lucide-react'

interface BookingData {
  bookingRef: string
  guestName: string
  programTitle: string
  status: string
  approvedDate: string | null
  approvedStartTime: string
  approvedEndTime: string
  djUsername: string
  djPassword: string
  durationMinutes: number
}

interface BroadcastClientProps {
  booking: BookingData
  organizationName: string
  webDjUrl: string
}

type TimeStatus = 'early' | 'active' | 'ended'

export default function BroadcastClient({
  booking,
  organizationName,
  webDjUrl,
}: BroadcastClientProps) {
  const [timeStatus, setTimeStatus] = useState<TimeStatus>('early')
  const [countdown, setCountdown] = useState<string>('')
  const [remainingTime, setRemainingTime] = useState<string>('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showIframe, setShowIframe] = useState(false)

  const parseScheduleTime = useCallback(() => {
    if (!booking.approvedDate || !booking.approvedStartTime || !booking.approvedEndTime) {
      return { start: null, end: null }
    }

    const dateStr = booking.approvedDate.split('T')[0]
    const startDateTime = new Date(`${dateStr}T${booking.approvedStartTime}:00`)
    const endDateTime = new Date(`${dateStr}T${booking.approvedEndTime}:00`)

    // Handle end time crossing midnight
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1)
    }

    return { start: startDateTime, end: endDateTime }
  }, [booking.approvedDate, booking.approvedStartTime, booking.approvedEndTime])

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const checkTimeStatus = useCallback(() => {
    const { start, end } = parseScheduleTime()
    if (!start || !end) return

    const now = new Date()

    // Add 5 minute grace period before start
    const earlyStart = new Date(start.getTime() - 5 * 60 * 1000)

    if (now < earlyStart) {
      // Too early
      setTimeStatus('early')
      const diff = earlyStart.getTime() - now.getTime()
      setCountdown(formatTimeRemaining(diff))
    } else if (now >= earlyStart && now < end) {
      // Active window (5 min before to end time)
      setTimeStatus('active')
      const diff = end.getTime() - now.getTime()
      setRemainingTime(formatTimeRemaining(diff))
    } else {
      // Time has ended
      setTimeStatus('ended')
    }
  }, [parseScheduleTime])

  useEffect(() => {
    checkTimeStatus()
    const interval = setInterval(checkTimeStatus, 1000)
    return () => clearInterval(interval)
  }, [checkTimeStatus])

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not set'
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/book/status/${booking.bookingRef}`}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            View Booking Status
          </Link>

          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-red-500/30 to-orange-600/30 p-4 rounded-xl border border-red-400/30 backdrop-blur">
              <Radio className="w-8 h-8 text-red-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{booking.programTitle}</h1>
              <p className="text-slate-400">{organizationName}</p>
            </div>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>{formatDate(booking.approvedDate)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{booking.approvedStartTime} - {booking.approvedEndTime}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm text-slate-500">{booking.bookingRef}</span>
            </div>
          </div>
        </div>

        {/* Time Status */}
        {timeStatus === 'early' && (
          <div className="bg-amber-500/20 backdrop-blur-xl rounded-2xl p-8 border border-amber-500/30 mb-6 text-center">
            <Timer className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-300 mb-2">Your Broadcast Starts Soon</h2>
            <p className="text-amber-400/70 mb-4">You can access the broadcast console 5 minutes before your scheduled time.</p>
            <div className="text-4xl font-mono font-bold text-white mb-4">{countdown}</div>
            <p className="text-sm text-amber-400/60">Time until access opens</p>
          </div>
        )}

        {timeStatus === 'ended' && (
          <div className="bg-slate-500/20 backdrop-blur-xl rounded-2xl p-8 border border-slate-500/30 mb-6 text-center">
            <MicOff className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-300 mb-2">Broadcast Time Ended</h2>
            <p className="text-slate-400">Your scheduled broadcast time has passed. Thank you for broadcasting with us!</p>
          </div>
        )}

        {timeStatus === 'active' && (
          <>
            {/* Active Status */}
            <div className="bg-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                  <div>
                    <p className="font-medium text-emerald-300">Your Broadcast Window is Active</p>
                    <p className="text-sm text-emerald-400/70">Time remaining: {remainingTime}</p>
                  </div>
                </div>
                <Mic className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            {/* Credentials */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 mb-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                Your Broadcast Credentials
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Use these credentials in the Web DJ console below. They will only work during your scheduled time.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Username</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-white text-lg">{booking.djUsername}</p>
                    <button
                      onClick={() => copyToClipboard(booking.djUsername, 'username')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedField === 'username' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Password</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-white text-lg">{booking.djPassword}</p>
                    <button
                      onClick={() => copyToClipboard(booking.djPassword, 'password')}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Web DJ Console */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              {/* Console Header */}
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
                    Instructions
                  </button>
                  <button
                    onClick={() => setShowIframe(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showIframe
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Web DJ Console
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
                        Enter your username and password above to connect. If you experience issues,{' '}
                        <a href={webDjUrl} target="_blank" rel="noopener noreferrer" className="underline">
                          open in a new tab
                        </a>.
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  <h3 className="text-xl font-bold text-white mb-6">How to Broadcast</h3>
                  <ol className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Copy your credentials</p>
                        <p className="text-slate-400 text-sm">Use the copy buttons above to copy your username and password.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Open the Web DJ Console</p>
                        <p className="text-slate-400 text-sm">Click on &quot;Web DJ Console&quot; tab above or open in a new tab.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Enter credentials and connect</p>
                        <p className="text-slate-400 text-sm">Paste your username and password, then click &quot;Connect&quot;.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Allow microphone access</p>
                        <p className="text-slate-400 text-sm">When prompted, allow the browser to access your microphone.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-300 font-bold flex-shrink-0">
                        5
                      </div>
                      <div>
                        <p className="font-medium text-white mb-1">Start Broadcasting!</p>
                        <p className="text-slate-400 text-sm">You are now live on air. Speak clearly into your microphone.</p>
                      </div>
                    </li>
                  </ol>

                  <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3 text-blue-300">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Tips for a Great Broadcast</p>
                        <ul className="text-blue-400/70 space-y-1">
                          <li>Use headphones to avoid echo</li>
                          <li>Find a quiet location</li>
                          <li>Test your microphone before starting</li>
                          <li>Keep an eye on the remaining time</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowIframe(true)}
                    className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all duration-300"
                  >
                    <Mic className="w-5 h-5" />
                    Open Web DJ Console
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-slate-400 text-sm">
            Need help? Contact {organizationName} directly.
          </p>
        </div>
      </div>
    </div>
  )
}
