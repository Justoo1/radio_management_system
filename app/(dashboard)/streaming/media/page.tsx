/**
 * Media Library Page
 * Upload and manage media files for AzuraCast streaming
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Music,
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Clock,
  HardDrive,
  FileAudio,
  Play,
  X,
  FolderOpen,
} from 'lucide-react'

interface MediaFile {
  id: number
  unique_id: string
  song_id: string
  title: string
  artist: string
  album: string
  genre: string
  length: number
  length_text: string
  path: string
  art?: string
  mtime: number
  size: number
  playlists?: Array<{ id: number; name: string }>
}

export default function MediaLibraryPage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/streaming/media')
      const data = await response.json()

      if (response.ok) {
        setMediaFiles(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch media')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch media')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file =>
      file.type.startsWith('audio/') ||
      file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)
    )

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only audio files are allowed.')
      setTimeout(() => setError(null), 5000)
    }

    setSelectedFiles(validFiles)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload')
      setTimeout(() => setError(null), 5000)
      return
    }

    setUploading(true)
    setError(null)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}`)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/streaming/media', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          successCount++
        } else {
          const data = await response.json()
          console.error(`Failed to upload ${file.name}:`, data.error)
          failCount++
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err)
        failCount++
      }
    }

    setUploading(false)
    setUploadProgress(null)
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (successCount > 0) {
      setSuccess(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`)
      setTimeout(() => setSuccess(null), 5000)
      fetchMedia()
    } else {
      setError('Failed to upload files')
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDelete = async (mediaId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    setDeleting(mediaId)
    try {
      const response = await fetch(`/api/streaming/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMediaFiles(mediaFiles.filter(m => m.id !== mediaId))
        setSuccess('Media file deleted successfully')
        setTimeout(() => setSuccess(null), 5000)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete media')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media')
      setTimeout(() => setError(null), 5000)
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const filteredMedia = mediaFiles.filter(media =>
    media.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    media.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    media.album?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalSize = mediaFiles.reduce((acc, m) => acc + (m.size || 0), 0)
  const totalDuration = mediaFiles.reduce((acc, m) => acc + (m.length || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/streaming"
            className="text-slate-400 hover:text-white flex items-center gap-1 text-sm mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Streaming
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            Media Library
          </h1>
          <p className="text-slate-400 mt-1">
            Upload and manage audio files for your stream
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-4 text-emerald-300 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/20">
              <FileAudio className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{mediaFiles.length}</p>
              <p className="text-sm text-slate-400">Total Files</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
              </p>
              <p className="text-sm text-slate-400">Total Duration</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/20">
              <HardDrive className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatFileSize(totalSize)}</p>
              <p className="text-sm text-slate-400">Total Size</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-pink-400" />
          Upload Media
        </h2>

        <div className="space-y-4">
          {/* File Input */}
          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-pink-500/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-300 mb-2">
              Click to select files or drag and drop
            </p>
            <p className="text-sm text-slate-500">
              Supports MP3, WAV, OGG, FLAC, AAC, M4A
            </p>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Music className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-slate-300 truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                <span className="text-sm text-pink-300">{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Files` : 'Files'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search by title, artist, or album..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-white placeholder:text-slate-500"
        />
      </div>

      {/* Media List */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400">
              {searchQuery ? 'No media files match your search' : 'No media files yet. Upload some!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Title</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Artist</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Album</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Duration</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-400">Size</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedia.map((media) => (
                  <tr
                    key={media.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-500/20">
                          <Music className="w-4 h-4 text-pink-400" />
                        </div>
                        <span className="text-white font-medium">
                          {media.title || 'Unknown Title'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {media.artist || 'Unknown Artist'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {media.album || '-'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {media.length_text || '-'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {formatFileSize(media.size)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(media.id, media.title)}
                          disabled={deleting === media.id}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === media.id ? (
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
        )}
      </div>
    </div>
  )
}
