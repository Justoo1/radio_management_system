/**
 * Media Library Page
 * Manage audio, video, images, and documents
 */

'use client'

import { FeatureGuard } from '@/components/feature-guard'
import { Feature } from '@/lib/features'
import { useState } from 'react'
import { Upload, Search, Image, Music, Video, FileText, Grid, List, Filter } from 'lucide-react'

export default function MediaLibraryPage() {
  return (
    <FeatureGuard
      feature={Feature.MEDIA_LIBRARY}
      featureDescription="Store and manage all your media files including audio, video, images, and documents"
    >
      <MediaLibraryContent />
    </FeatureGuard>
  )
}

function MediaLibraryContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mediaType, setMediaType] = useState<'all' | 'audio' | 'video' | 'image' | 'document'>('all')
  const [search, setSearch] = useState('')

  // Placeholder data - will be replaced with actual API call
  const mediaFiles = []

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
        <p className="text-slate-400">Manage your audio, video, images, and documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Music className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Audio Files</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Video className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Video Files</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Image className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Images</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm">Documents</span>
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search media files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Filter by Type */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as any)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Types</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Button */}
          <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30">
            <Upload className="w-5 h-5" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
        <div className="max-w-md mx-auto">
          <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Image className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">No Media Files Yet</h3>
          <p className="text-slate-400 mb-6">
            Upload your first media file to get started. Supported formats include audio (MP3, WAV), video (MP4, AVI), images (JPG, PNG), and documents (PDF, DOC).
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition shadow-lg shadow-purple-500/30">
            <Upload className="w-5 h-5" />
            Upload Your First File
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="font-semibold text-blue-400 mb-2">Media Library Features</h4>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Upload and organize audio files for on-air playback</li>
          <li>• Store video content for social media and archiving</li>
          <li>• Manage images for programs, clients, and marketing</li>
          <li>• Keep important documents organized and accessible</li>
          <li>• Tag and categorize files for easy searching</li>
          <li>• Integration with On-Air dashboard for instant playback</li>
        </ul>
      </div>
    </div>
  )
}
