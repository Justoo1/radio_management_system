'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Music,
  Users,
  ExternalLink,
  Loader,
  MessageCircle,
  Send,
  Heart,
  Megaphone,
  HelpCircle,
  Trophy,
  Phone,
  User,
  Mail,
  Clock,
  Calendar,
  History,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Pin,
  Loader2,
  Share2,
  Copy,
  Check,
} from 'lucide-react'

interface Props {
  stationName: string
  stationDescription: string
  genre: string
  streamUrl: string
  logoUrl: string | null
  accentColor: string
  organizationSlug: string
  stationId: number | null
}

interface NowPlaying {
  song?: {
    title: string
    artist: string
    art?: string
  }
  listeners?: {
    current: number
  }
  is_online?: boolean
}

interface ChatMessage {
  id: string
  senderName: string
  message: string
  isFromStaff: boolean
  isPinned: boolean
  createdAt: string
}

interface TrackHistory {
  title: string
  artist: string
  playedAt: string
  art?: string
}

interface ProgramSchedule {
  id: string
  name: string
  startTime: string
  endTime: string
  host?: string
  isLive?: boolean
}

// Request form schema
const requestSchema = z.object({
  listenerName: z.string().min(1, 'Name is required').max(100),
  listenerPhone: z.string().min(1, 'Phone number is required').max(20),
  listenerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  requestType: z.enum(['SONG_REQUEST', 'DEDICATION', 'SHOUTOUT', 'QUESTION', 'COMMENT', 'CONTEST_ENTRY']),
  songTitle: z.string().max(200).optional(),
  songArtist: z.string().max(200).optional(),
  message: z.string().max(500, 'Message too long (max 500 characters)').optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

const requestTypes = [
  { value: 'SONG_REQUEST', label: 'Song Request', icon: Music, color: 'from-blue-500 to-cyan-500' },
  { value: 'DEDICATION', label: 'Dedication', icon: Heart, color: 'from-pink-500 to-rose-500' },
  { value: 'SHOUTOUT', label: 'Shoutout', icon: Megaphone, color: 'from-orange-500 to-amber-500' },
  { value: 'QUESTION', label: 'Question', icon: HelpCircle, color: 'from-purple-500 to-violet-500' },
  { value: 'COMMENT', label: 'Comment', icon: MessageCircle, color: 'from-emerald-500 to-teal-500' },
  { value: 'CONTEST_ENTRY', label: 'Contest', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
]

const LISTENER_NAME_KEY = 'rms_listener_name'

export default function PublicStreamPlayer({
  stationName,
  stationDescription,
  genre,
  streamUrl,
  logoUrl,
  accentColor,
  organizationSlug,
  stationId,
}: Props) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // UI state
  const [activeTab, setActiveTab] = useState<'playing' | 'chat' | 'request' | 'schedule'>('playing')
  const [userName, setUserName] = useState<string>('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [tempName, setTempName] = useState('')
  const [nameLoaded, setNameLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [chatLoading, setChatLoading] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Request state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  // History & Schedule state
  const [trackHistory, setTrackHistory] = useState<TrackHistory[]>([])
  const [schedule, setSchedule] = useState<ProgramSchedule[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requestType: 'SONG_REQUEST',
    },
  })

  const selectedType = watch('requestType')

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem(LISTENER_NAME_KEY)
    if (savedName) {
      setUserName(savedName)
    }
    setNameLoaded(true)
  }, [])

  // Save name
  const handleSaveName = useCallback((name: string) => {
    const trimmedName = name.trim()
    if (trimmedName) {
      localStorage.setItem(LISTENER_NAME_KEY, trimmedName)
      setUserName(trimmedName)
      setShowNameModal(false)
    }
  }, [])

  // Fetch now playing info
  useEffect(() => {
    const fetchNowPlaying = async () => {
      if (!stationId) return

      try {
        const response = await fetch(`/api/public/streaming/${organizationSlug}/now-playing`)
        if (response.ok) {
          const data = await response.json()
          setNowPlaying(data)
        }
      } catch (error) {
        console.error('Failed to fetch now playing:', error)
      }
    }

    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 15000)

    return () => clearInterval(interval)
  }, [stationId, organizationSlug])

  // Fetch track history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/public/streaming/${organizationSlug}/history`)
        if (response.ok) {
          const data = await response.json()
          setTrackHistory(data.history || [])
        }
      } catch (error) {
        console.error('Failed to fetch history:', error)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 30000)
    return () => clearInterval(interval)
  }, [organizationSlug])

  // Fetch schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(`/api/public/streaming/${organizationSlug}/schedule`)
        if (response.ok) {
          const data = await response.json()
          setSchedule(data.schedule || [])
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error)
      }
    }

    fetchSchedule()
  }, [organizationSlug])

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/public/chat?slug=${organizationSlug}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
          setPinnedMessages(data.pinned || [])
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
      } finally {
        setChatLoading(false)
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // Poll for new messages
    return () => clearInterval(interval)
  }, [organizationSlug])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollButton(!isNearBottom)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!showScrollButton && activeTab === 'chat') {
      scrollToBottom()
    }
  }, [messages, showScrollButton, activeTab, scrollToBottom])

  // Player controls
  const handlePlayPause = () => {
    if (!audioRef.current || !streamUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      setIsLoading(true)
      audioRef.current.src = streamUrl
      audioRef.current.load()
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Playback failed:', error)
          setIsLoading(false)
        })
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }

  // Chat send
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return

    if (!userName) {
      setShowNameModal(true)
      return
    }

    setSendingMessage(true)
    try {
      const response = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationSlug,
          senderName: userName,
          message: newMessage.trim(),
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // Immediately fetch new messages
        const messagesResponse = await fetch(`/api/public/chat?slug=${organizationSlug}`)
        if (messagesResponse.ok) {
          const data = await messagesResponse.json()
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Request submit
  const onSubmitRequest = async (data: RequestFormData) => {
    setSubmitting(true)
    setRequestError(null)

    try {
      const response = await fetch('/api/public/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationSlug,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        reset()
      } else {
        const errorData = await response.json()
        setRequestError(errorData.error || 'Failed to submit request')
      }
    } catch (error) {
      setRequestError('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Copy share link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen p-4 gap-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Left Column - Player */}
      <div className="lg:w-1/3 flex flex-col gap-4">
        {/* Main Player Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
          {/* Station Header */}
          <div
            className="p-6 text-center"
            style={{ background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)` }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={stationName}
                className="w-24 h-24 mx-auto rounded-2xl object-cover mb-4 shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 mx-auto rounded-2xl mb-4 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Radio className="w-12 h-12 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white mb-1">{stationName}</h1>
            {genre && (
              <p className="text-sm text-white/70">{genre}</p>
            )}
            {stationDescription && (
              <p className="text-sm text-white/60 mt-2 line-clamp-2">{stationDescription}</p>
            )}
          </div>

          {/* Now Playing */}
          <div className="px-6 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ backgroundColor: `${accentColor}30` }}
              >
                {nowPlaying?.song?.art ? (
                  <img
                    src={nowPlaying.song.art}
                    alt="Album art"
                    className="w-14 h-14 object-cover"
                  />
                ) : (
                  <Music className="w-7 h-7" style={{ color: accentColor }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Now Playing</p>
                {nowPlaying?.song ? (
                  <>
                    <p className="text-white font-medium truncate">{nowPlaying.song.title || 'Unknown Track'}</p>
                    <p className="text-sm text-white/60 truncate">{nowPlaying.song.artist || 'Unknown Artist'}</p>
                  </>
                ) : (
                  <p className="text-white/60 text-sm">
                    {nowPlaying?.is_online === false ? 'Station Offline' : 'Loading...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Play Button & Volume */}
          <div className="px-6 py-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-6">
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-white/60 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
              </div>

              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                disabled={!streamUrl || isLoading}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                {isLoading ? (
                  <Loader className="w-8 h-8 text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white ml-1" />
                )}
              </button>

              {/* Listeners Count */}
              <div className="flex items-center gap-2 text-white/60">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">{nowPlaying?.listeners?.current || 0}</span>
              </div>
            </div>

            {!streamUrl && (
              <p className="text-center text-red-400 text-sm mt-4">
                Stream URL not configured
              </p>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 bg-white/5 flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isPlaying ? 'Live' : 'Click play to listen'}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 hover:text-white/80 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>

        {/* Track History */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <History className="w-4 h-4 text-white/60" />
            <h3 className="font-medium text-white text-sm">Recently Played</h3>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {trackHistory.length > 0 ? (
              trackHistory.slice(0, 5).map((track, index) => (
                <div key={index} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {track.art ? (
                      <img src={track.art} alt="" className="w-10 h-10 object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{track.title}</p>
                    <p className="text-xs text-white/50 truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-white/40">{formatTime(track.playedAt)}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-white/40 text-sm">
                No recent tracks
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Engagement */}
      <div className="lg:w-2/3 flex flex-col gap-4">
        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-1.5 border border-white/20 flex gap-1 overflow-x-auto">
          {[
            { id: 'playing', label: 'Now Playing', icon: Music },
            { id: 'chat', label: 'Live Chat', icon: MessageCircle },
            { id: 'request', label: 'Send Request', icon: Send },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {/* Now Playing Tab */}
          {activeTab === 'playing' && (
            <div className="p-6 h-full flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div
                  className="w-32 h-32 rounded-2xl mb-6 flex items-center justify-center overflow-hidden shadow-xl"
                  style={{ backgroundColor: `${accentColor}30` }}
                >
                  {nowPlaying?.song?.art ? (
                    <img
                      src={nowPlaying.song.art}
                      alt="Album art"
                      className="w-32 h-32 object-cover"
                    />
                  ) : (
                    <Music className="w-16 h-16" style={{ color: accentColor }} />
                  )}
                </div>
                {nowPlaying?.song ? (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">{nowPlaying.song.title || 'Unknown Track'}</h2>
                    <p className="text-lg text-white/60">{nowPlaying.song.artist || 'Unknown Artist'}</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {nowPlaying?.is_online === false ? 'Station Offline' : 'Waiting for track info...'}
                    </h2>
                    <p className="text-white/60">Tune in to listen</p>
                  </>
                )}

                <div className="mt-8 flex items-center gap-6 text-white/60">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{nowPlaying?.listeners?.current || 0} listeners</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    <span>{isPlaying ? 'Playing' : 'Paused'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('request')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/50 hover:to-pink-600/50 border border-purple-500/30 text-white rounded-xl transition-all"
                >
                  <Heart className="w-5 h-5" />
                  Request a Song
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/30 text-white rounded-xl transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Join the Chat
                </button>
              </div>
            </div>
          )}

          {/* Live Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Live Chat</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{messages.length} messages</span>
                    </div>
                  </div>
                </div>

                {/* User name */}
                <button
                  onClick={() => {
                    setTempName(userName)
                    setShowNameModal(true)
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/20 transition-colors"
                >
                  <User className="w-3 h-3" />
                  {userName || 'Set Name'}
                </button>
              </div>

              {/* Pinned Messages */}
              {pinnedMessages.length > 0 && (
                <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
                  {pinnedMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2 text-xs">
                      <Pin className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium text-amber-400">{msg.senderName}:</span>
                        <span className="text-slate-300 ml-1">{msg.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <Radio className="w-12 h-12 mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isFromStaff ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          msg.isFromStaff
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${msg.isFromStaff ? 'text-white/80' : 'text-purple-400'}`}>
                            {msg.senderName}
                            {msg.isFromStaff && (
                              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">STAFF</span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-4 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              )}

              {/* Input */}
              <div className="p-3 bg-white/5 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={userName ? "Type a message..." : "Set your name to chat"}
                    maxLength={300}
                    disabled={!userName}
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-sm disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage || !userName}
                    className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Request Tab */}
          {activeTab === 'request' && (
            <div className="p-6 overflow-y-auto max-h-[600px]">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">Request Submitted!</h2>
                  <p className="text-slate-300 mb-8">
                    Thank you for your request! The station will review it shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all"
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-6">
                  {/* Request Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">What would you like to do?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {requestTypes.map((type) => {
                        const Icon = type.icon
                        const isSelected = selectedType === type.value
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setValue('requestType', type.value as any)}
                            className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                              isSelected
                                ? `bg-gradient-to-br ${type.color} border-transparent shadow-lg`
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <p className={`font-medium text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {type.label}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Your Name *
                      </label>
                      <input
                        {...register('listenerName')}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                      {errors.listenerName && (
                        <p className="mt-1 text-sm text-red-400">{errors.listenerName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone *
                      </label>
                      <input
                        {...register('listenerPhone')}
                        placeholder="+233 XX XXX XXXX"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                      />
                      {errors.listenerPhone && (
                        <p className="mt-1 text-sm text-red-400">{errors.listenerPhone.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      {...register('listenerEmail')}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    />
                  </div>

                  {/* Song Info */}
                  {(selectedType === 'SONG_REQUEST' || selectedType === 'DEDICATION') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          <Music className="w-4 h-4 inline mr-2" />
                          Song Title
                        </label>
                        <input
                          {...register('songTitle')}
                          placeholder="Enter song title"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Artist</label>
                        <input
                          {...register('songArtist')}
                          placeholder="Artist name"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      <MessageCircle className="w-4 h-4 inline mr-2" />
                      Your Message <span className="text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      {...register('message')}
                      rows={3}
                      placeholder={
                        selectedType === 'DEDICATION' ? 'Write your dedication message...' :
                        selectedType === 'SHOUTOUT' ? 'Who do you want to shout out?' :
                        selectedType === 'QUESTION' ? 'What would you like to ask?' :
                        'Share your thoughts...'
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>
                    )}
                  </div>

                  {/* Error */}
                  {requestError && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-300 text-sm">{requestError}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Today&apos;s Schedule</h3>
                  <p className="text-xs text-slate-400">See what&apos;s coming up</p>
                </div>
              </div>

              {schedule.length > 0 ? (
                <div className="space-y-3">
                  {schedule.map((program) => (
                    <div
                      key={program.id}
                      className={`p-4 rounded-xl border transition-all ${
                        program.isLive
                          ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{program.name}</h4>
                            {program.isLive && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                                LIVE
                              </span>
                            )}
                          </div>
                          {program.host && (
                            <p className="text-sm text-white/60 mt-1">with {program.host}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <Clock className="w-4 h-4" />
                          <span>{program.startTime} - {program.endTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No schedule available</p>
                  <p className="text-sm mt-1">Check back later for program times</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs">
          Powered by Radio Management System
        </p>
      </div>

      {/* Welcome Name Modal */}
      {showNameModal && nameLoaded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 rounded-3xl border border-white/20 p-8 shadow-2xl">
            {userName && (
              <button
                onClick={() => setShowNameModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {userName ? 'Update Your Name' : 'Welcome!'}
              </h2>
              <p className="text-slate-400">
                {userName ? 'Change how your name appears in the chat' : 'Enter your name to join the conversation'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) {
                      handleSaveName(tempName)
                    }
                  }}
                  placeholder="Enter your name"
                  maxLength={50}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-lg"
                />
              </div>

              <button
                onClick={() => handleSaveName(tempName)}
                disabled={!tempName.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all shadow-lg disabled:opacity-50"
              >
                <MessageCircle className="w-5 h-5" />
                {userName ? 'Update Name' : 'Join the Chat'}
              </button>

              {!userName && (
                <button
                  onClick={() => {
                    setUserName('Listener')
                    setShowNameModal(false)
                  }}
                  className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Continue as Guest
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
