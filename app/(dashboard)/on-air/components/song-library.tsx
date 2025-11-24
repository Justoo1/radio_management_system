'use client';

import { useState, useEffect } from 'react';
import { Search, Music, Plus, Filter, Clock } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration: number;
  rotation: string;
  thumbnailUrl?: string;
  audioUrl: string;
  totalPlays: number;
  lastPlayedAt?: string;
}

interface SongLibraryProps {
  onAddToQueue: (song: Song) => void;
}

export function SongLibrary({ onAddToQueue }: SongLibraryProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [rotationFilter, setRotationFilter] = useState<string>('');

  useEffect(() => {
    fetchSongs();
  }, [genreFilter, rotationFilter, search]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (genreFilter) params.append('genre', genreFilter);
      if (rotationFilter) params.append('rotation', rotationFilter);

      const response = await fetch(`/api/onair/songs?${params.toString()}`);
      const data = await response.json();
      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRotationColor = (rotation: string) => {
    switch (rotation) {
      case 'POWER':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'LIGHT':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'GOLD':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const handleAddToQueue = (song: Song) => {
    onAddToQueue(song);
    // Show a toast or feedback
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Song Library</h3>
          <p className="text-sm text-slate-400">
            {songs.length} song{songs.length === 1 ? '' : 's'} available
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search songs by title or artist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Genre</label>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Genres</option>
              <option value="Pop">Pop</option>
              <option value="Rock">Rock</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="R&B">R&B</option>
              <option value="Gospel">Gospel</option>
              <option value="Highlife">Highlife</option>
              <option value="Afrobeats">Afrobeats</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1">Rotation</label>
            <select
              value={rotationFilter}
              onChange={(e) => setRotationFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Rotations</option>
              <option value="POWER">Power</option>
              <option value="MEDIUM">Medium</option>
              <option value="LIGHT">Light</option>
              <option value="GOLD">Gold</option>
              <option value="RECURRENT">Recurrent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Songs List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No songs found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {songs.map((song) => (
            <div
              key={song.id}
              className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-lg p-4 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  {song.thumbnailUrl ? (
                    <img
                      src={song.thumbnailUrl}
                      alt={song.title}
                      className="w-14 h-14 rounded object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Music className="w-7 h-7 text-white" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate mb-1">
                    {song.title}
                  </h4>
                  <p className="text-sm text-slate-400 truncate mb-2">
                    {song.artist}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${getRotationColor(
                        song.rotation
                      )}`}
                    >
                      {song.rotation}
                    </span>
                    {song.genre && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {song.genre}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(song.duration)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Played {song.totalPlays} times
                    </span>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  onClick={() => handleAddToQueue(song)}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add to Queue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
