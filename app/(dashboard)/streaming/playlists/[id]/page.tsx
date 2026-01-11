/**
 * Playlist Detail Page
 * View and manage songs in a playlist
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ListMusic,
  Plus,
  ArrowLeft,
  Music,
  Clock,
  GripVertical,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Save,
  X,
} from 'lucide-react'

interface PlaylistSong {
  id: string
  title: string
  artist?: string
  duration?: number
  position: number
  mediaFile?: {
    id: string
    name: string
    duration?: number
    url?: string
  }
}

interface Playlist {
  id: string
  name: string
  type: string
  isEnabled: boolean
  weight?: number
  songs: PlaylistSong[]
  _count?: {
    songs: number
  }
}

interface MediaFile {
  id: string
  name: string
  duration?: number
  url?: string
  type: string
}

export default function PlaylistDetailPage() {
  const params = useParams()
  const playlistId = params.id as string

  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])

  useEffect(() => {
    fetchPlaylist()
    fetchMediaFiles()
  }, [playlistId])

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/streaming/playlists/${playlistId}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylist(data.data)
      } else if (response.status === 404) {
        setError('Playlist not found')
      } else {
        throw new Error('Failed to fetch playlist')
      }
    } catch (err) {
      setError('Failed to load playlist')
    } finally {
      setLoading(false)
    }
  }

  const fetchMediaFiles = async () => {
    try {
      const response = await fetch('/api/media?type=AUDIO&pageSize=100')
      if (response.ok) {
        const data = await response.json()
        setMediaFiles(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch media files:', err)
    }
  }

  const handleAddSongs = async () => {
    if (selectedMedia.length === 0) {
      setError('Please select at least one song')
      setTimeout(() => setError(null), 5000)
      return
    }

    setAdding(true)
    setError(null)

    try {
      const response = await fetch(`/api/streaming/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaFileIds: selectedMedia }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowAddModal(false)
        setSelectedMedia([])
        setSearchQuery('')
        fetchPlaylist() // Refresh playlist
        setSuccess(`Added ${selectedMedia.length} song(s) to playlist`)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error(data.error || 'Failed to add songs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add songs')
      setTimeout(() => setError(null), 5000)
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveSong = async (songId: string) => {
    setRemoving(songId)

    try {
      const response = await fetch(`/api/streaming/playlists/${playlistId}/songs?songId=${songId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPlaylist((prev) =>
          prev
            ? {
                ...prev,
                songs: prev.songs.filter((s) => s.id !== songId),
              }
            : null
        )
        setSuccess('Song removed from playlist')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        throw new Error('Failed to remove song')
      }
    } catch (err) {
      setError('Failed to remove song')
      setTimeout(() => setError(null), 5000)
    } finally {
      setRemoving(null)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const filteredMediaFiles = mediaFiles.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !playlist?.songs.some((s) => s.mediaFile?.id === file.id)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-slate-400">Loading playlist...</p>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ListMusic className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-400 mb-4">Playlist not found</p>
          <Link href="/streaming/playlists" className="text-pink-400 hover:text-pink-300">
            ← Back to Playlists
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl" />
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
            href="/streaming/playlists"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Playlists
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                {playlist.name}
              </h1>
              <p className="text-slate-400 text-lg flex items-center gap-2">
                <Music className="w-4 h-4" />
                {playlist.songs.length} songs
                <span className="text-slate-600">•</span>
                <span className={playlist.isEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {playlist.isEnabled ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Add Songs
            </button>
          </div>
        </div>

        {/* Songs List */}
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400 mb-4 text-lg">No songs in this playlist</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 font-semibold transition-colors"
            >
              Add songs from your media library →
            </button>
          </div>
        ) : (
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 border-b border-white/10 text-sm font-medium text-slate-400">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Title</div>
                <div className="col-span-3">Artist</div>
                <div className="col-span-2 text-right">Duration</div>
                <div className="col-span-1"></div>
              </div>

              {/* Songs */}
              <div className="divide-y divide-white/10">
                {playlist.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors items-center"
                  >
                    <div className="col-span-1 text-slate-500 font-medium">{index + 1}</div>
                    <div className="col-span-5">
                      <p className="text-white font-medium truncate">
                        {song.title || song.mediaFile?.name || 'Unknown'}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-slate-400 truncate">{song.artist || '-'}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(song.duration || song.mediaFile?.duration)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveSong(song.id)}
                        disabled={removing === song.id}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {removing === song.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Songs Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-pink-400" />
                Add Songs to Playlist
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedMedia([])
                  setSearchQuery('')
                }}
                className="text-slate-400 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search media library..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white placeholder-slate-500"
              />
            </div>

            {/* Selected count */}
            {selectedMedia.length > 0 && (
              <div className="mb-4 text-sm text-pink-300">
                {selectedMedia.length} song(s) selected
              </div>
            )}

            {/* Media list */}
            <div className="flex-1 overflow-y-auto mb-4">
              {filteredMediaFiles.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-slate-400 text-sm">
                    {searchQuery ? 'No matching files found' : 'No audio files in media library'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMediaFiles.map((file) => (
                    <label
                      key={file.id}
                      className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedMedia.includes(file.id)
                          ? 'bg-pink-600/20 border border-pink-500/50'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMedia.includes(file.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMedia([...selectedMedia, file.id])
                          } else {
                            setSelectedMedia(selectedMedia.filter((id) => id !== file.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-pink-500 focus:ring-pink-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <p className="text-xs text-slate-400">{file.type}</p>
                      </div>
                      {file.duration && (
                        <span className="text-sm text-slate-400">{formatDuration(file.duration)}</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedMedia([])
                  setSearchQuery('')
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSongs}
                disabled={adding || selectedMedia.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add {selectedMedia.length > 0 ? `(${selectedMedia.length})` : ''} Songs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
