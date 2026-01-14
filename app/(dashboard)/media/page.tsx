"use client";

import { FeatureGuard } from "@/components/feature-guard";
import { Feature } from "@/lib/features";
import { useState, useEffect } from "react";
import {
  Upload,
  Search,
  Music,
  Filter,
  Grid,
  List,
  Play,
  Trash2,
  Edit,
  Download,
  Tag,
  Clock,
  FileAudio,
  Radio,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  duration: number | null;
  mimeType: string;
  category: string;
  tags: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  uploadedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
}

// Helper to parse tags from JSON string
const parseTags = (tags: string | null): string[] => {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const MEDIA_CATEGORIES = [
  { value: "JINGLE", label: "Jingle" },
  { value: "SOUND_EFFECT", label: "Sound Effect" },
  { value: "ADVERTISEMENT", label: "Advertisement" },
  { value: "INTRO", label: "Intro" },
  { value: "OUTRO", label: "Outro" },
  { value: "BUMPER", label: "Bumper" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "PSA", label: "Public Service Announcement" },
  { value: "OTHER", label: "Other" },
];

export default function MediaLibraryPage() {
  return (
    <FeatureGuard
      feature={Feature.MEDIA_LIBRARY}
      featureDescription="Store and manage all your media files including audio files for on-air playback"
    >
      <MediaLibraryContent />
    </FeatureGuard>
  );
}

// Streaming media file interface (from AzuraCast)
interface StreamingMediaFile {
  id: number;
  unique_id: string;
  song_id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  length: number;
  length_text: string;
  path: string;
  art?: string;
  mtime: number;
  size: number;
}

function MediaLibraryContent() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [streamingMediaFiles, setStreamingMediaFiles] = useState<StreamingMediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"local" | "streaming">("local");

  // Streaming upload state
  const [streamingUploading, setStreamingUploading] = useState(false);
  const [streamingUploadProgress, setStreamingUploadProgress] = useState<string | null>(null);
  const [selectedStreamingFiles, setSelectedStreamingFiles] = useState<File[]>([]);
  const [hasStreamingConfig, setHasStreamingConfig] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    jingles: 0,
    ads: 0,
    soundEffects: 0,
  });

  // Fetch media files
  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const response = await fetch(`/api/media?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setMediaFiles(data.data || []);
        calculateStats(data.data || []);
      } else {
        toast.error(data.error || "Failed to fetch media files");
      }
    } catch (error) {
      console.error("Error fetching media files:", error);
      toast.error("Failed to fetch media files");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (files: MediaFile[]) => {
    setStats({
      total: files.length,
      jingles: files.filter((f) => f.category === "JINGLE").length,
      ads: files.filter((f) => f.category === "ADVERTISEMENT").length,
      soundEffects: files.filter((f) => f.category === "SOUND_EFFECT").length,
    });
  };

  useEffect(() => {
    fetchMediaFiles();
    fetchStreamingMediaFiles();
  }, [search, categoryFilter]);

  // Fetch streaming media files from AzuraCast
  const fetchStreamingMediaFiles = async () => {
    try {
      setStreamingLoading(true);
      const response = await fetch("/api/streaming/media");
      const data = await response.json();

      if (response.ok) {
        setStreamingMediaFiles(data.data || []);
        setHasStreamingConfig(true);
      } else if (response.status === 404) {
        // No streaming config - that's okay
        setHasStreamingConfig(false);
        setStreamingMediaFiles([]);
      } else {
        console.error("Failed to fetch streaming media:", data.error);
      }
    } catch (error) {
      console.error("Error fetching streaming media files:", error);
    } finally {
      setStreamingLoading(false);
    }
  };

  // Handle streaming file selection
  const handleStreamingFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("audio/") ||
        file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)
    );

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only audio files are allowed.");
    }

    setSelectedStreamingFiles(validFiles);
  };

  // Upload files to AzuraCast streaming
  const handleStreamingUpload = async () => {
    if (selectedStreamingFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setStreamingUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedStreamingFiles.length; i++) {
      const file = selectedStreamingFiles[i];
      setStreamingUploadProgress(
        `Uploading ${i + 1} of ${selectedStreamingFiles.length}: ${file.name}`
      );

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/streaming/media", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          successCount++;
        } else {
          const data = await response.json();
          console.error(`Failed to upload ${file.name}:`, data.error);
          failCount++;
        }
      } catch (err) {
        console.error(`Error uploading ${file.name}:`, err);
        failCount++;
      }
    }

    setStreamingUploading(false);
    setStreamingUploadProgress(null);
    setSelectedStreamingFiles([]);

    if (successCount > 0) {
      toast.success(
        `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}${
          failCount > 0 ? ` (${failCount} failed)` : ""
        }`
      );
      fetchStreamingMediaFiles();
    } else {
      toast.error("Failed to upload files");
    }
  };

  // Delete streaming media file
  const handleDeleteStreamingMedia = async (mediaId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/streaming/media/${mediaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setStreamingMediaFiles(streamingMediaFiles.filter((m) => m.id !== mediaId));
        toast.success("Media file deleted successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete media file");
      }
    } catch (error) {
      console.error("Error deleting streaming media file:", error);
      toast.error("Failed to delete media file");
    }
  };

  // Delete media file
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Media file deleted successfully");
        fetchMediaFiles();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete media file");
      }
    } catch (error) {
      console.error("Error deleting media file:", error);
      toast.error("Failed to delete media file");
    }
  };

  // Update media file
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFile) return;

    const formData = new FormData(e.currentTarget);
    const category = formData.get("category") as string;
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    try {
      const response = await fetch(`/api/media/${editingFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          tags,
        }),
      });

      if (response.ok) {
        toast.success("Media file updated successfully");
        setShowEditDialog(false);
        setEditingFile(null);
        fetchMediaFiles();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update media file");
      }
    } catch (error) {
      console.error("Error updating media file:", error);
      toast.error("Failed to update media file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Media Library</h1>
        <p className="text-slate-400">
          Manage your audio files for on-air playback and advertisements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("local")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "local"
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-slate-400 hover:bg-white/20"
          }`}
        >
          <FileAudio className="w-4 h-4 inline-block mr-2" />
          Local Media
        </button>
        <button
          onClick={() => setActiveTab("streaming")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "streaming"
              ? "bg-purple-500 text-white"
              : "bg-white/10 text-slate-400 hover:bg-white/20"
          }`}
        >
          <Radio className="w-4 h-4 inline-block mr-2" />
          Streaming Media
          {streamingMediaFiles.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {streamingMediaFiles.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "local" ? (
        <>
          {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <FileAudio className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Files</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <Music className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Jingles</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.jingles}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <Music className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Advertisements</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.ads}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <Music className="w-5 h-5 text-orange-400" />
            </div>
            <span className="text-slate-400 text-sm">Sound Effects</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.soundEffects}</p>
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

          {/* Filter by Category */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              {MEDIA_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Upload Button */}
          <UploadButton
            endpoint="audioUploader"
            onClientUploadComplete={(res) => {
              toast.success(`${res.length} file(s) uploaded successfully!`);
              fetchMediaFiles();
            }}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            appearance={{
              button:
                "ut-button:bg-gradient-to-r ut-button:from-purple-600 ut-button:to-pink-600 ut-button:text-white ut-button:font-semibold ut-button:px-6 ut-button:py-2 ut-button:rounded-lg ut-button:shadow-lg ut-button:shadow-purple-500/30 ut-uploading:cursor-not-allowed ut-readying:cursor-wait",
              container: "flex items-center gap-2",
              allowedContent: "hidden",
            }}
          />
        </div>
      </div>

      {/* Media Files Grid/List */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
          <p className="text-slate-400">Loading media files...</p>
        </div>
      ) : mediaFiles.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-12 border border-white/20 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-purple-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileAudio className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No Media Files Yet
            </h3>
            <p className="text-slate-400 mb-6">
              Upload your first audio file to get started. Supported formats
              include MP3, WAV, OGG, and more.
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaFiles.map((file) => (
            <div
              key={file.id}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-purple-500/50 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Music className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingFile(file);
                      setShowEditDialog(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-white mb-2 truncate">
                {file.name}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white">
                    {
                      MEDIA_CATEGORIES.find((c) => c.value === file.category)
                        ?.label
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-white">
                    {formatDuration(file.duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Size:</span>
                  <span className="text-white">{formatFileSize(file.size)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Plays:</span>
                  <span className="text-white">{file.usageCount}</span>
                </div>

                {parseTags(file.tags).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseTags(file.tags).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <audio
                  src={file.url}
                  controls
                  className="w-full"
                  style={{ height: "40px" }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  File Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Duration
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Size
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                  Plays
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mediaFiles.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-white/10 hover:bg-white/5 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-purple-400" />
                      <span className="text-white truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {
                      MEDIA_CATEGORIES.find((c) => c.value === file.category)
                        ?.label
                    }
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {formatDuration(file.duration)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{file.usageCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingFile(file);
                          setShowEditDialog(true);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </>
      ) : (
        /* Streaming Media Tab */
        <div className="space-y-6">
          {/* Streaming Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <FileAudio className="w-5 h-5 text-pink-400" />
                </div>
                <span className="text-slate-400 text-sm">Total Files</span>
              </div>
              <p className="text-3xl font-bold text-white">{streamingMediaFiles.length}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-slate-400 text-sm">Total Duration</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {Math.floor(streamingMediaFiles.reduce((acc, m) => acc + (m.length || 0), 0) / 3600)}h{" "}
                {Math.floor((streamingMediaFiles.reduce((acc, m) => acc + (m.length || 0), 0) % 3600) / 60)}m
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                  <Radio className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm">Total Size</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatFileSize(streamingMediaFiles.reduce((acc, m) => acc + (m.size || 0), 0))}
              </p>
            </div>
          </div>

          {/* Upload to Streaming Section */}
          {hasStreamingConfig ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-pink-400" />
                Upload to Stream
              </h3>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-pink-500/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.wav,.ogg,.flac,.aac,.m4a"
                    onChange={handleStreamingFileSelect}
                    className="hidden"
                    id="streaming-file-input"
                  />
                  <label htmlFor="streaming-file-input" className="cursor-pointer">
                    <Music className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-300 mb-2">Click to select files to upload</p>
                    <p className="text-sm text-slate-500">
                      Supports MP3, WAV, OGG, FLAC, AAC, M4A (max 100MB per file)
                    </p>
                  </label>
                </div>

                {selectedStreamingFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      {selectedStreamingFiles.length} file{selectedStreamingFiles.length > 1 ? "s" : ""} selected
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedStreamingFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-2 text-sm">
                          <span className="text-slate-300 truncate">{file.name}</span>
                          <span className="text-slate-500">{formatFileSize(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {streamingUploadProgress && (
                  <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
                      <span className="text-sm text-pink-300">{streamingUploadProgress}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleStreamingUpload}
                  disabled={streamingUploading || selectedStreamingFiles.length === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {streamingUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload to AzuraCast
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
              <Radio className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white mb-2">Streaming Not Configured</h3>
              <p className="text-slate-400 mb-4">
                Configure your streaming settings to upload media to AzuraCast.
              </p>
              <a
                href="/streaming/settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition"
              >
                Go to Streaming Settings
              </a>
            </div>
          )}

          {/* Streaming Media List */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Streaming Media Files</h3>
              <button
                onClick={fetchStreamingMediaFiles}
                disabled={streamingLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 text-slate-400 ${streamingLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {streamingLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading streaming media...</p>
              </div>
            ) : streamingMediaFiles.length === 0 ? (
              <div className="p-12 text-center">
                <Music className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No streaming media files yet. Upload some!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Artist</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Album</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Size</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {streamingMediaFiles
                    .filter(
                      (m) =>
                        !search ||
                        m.title?.toLowerCase().includes(search.toLowerCase()) ||
                        m.artist?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((file) => (
                      <tr key={file.id} className="border-b border-white/10 hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-pink-400" />
                            <span className="text-white truncate max-w-xs">
                              {file.title || "Unknown Title"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{file.artist || "Unknown"}</td>
                        <td className="px-6 py-4 text-slate-300">{file.album || "-"}</td>
                        <td className="px-6 py-4 text-slate-300">{file.length_text || "-"}</td>
                        <td className="px-6 py-4 text-slate-300">{formatFileSize(file.size)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeleteStreamingMedia(file.id, file.title)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Media File</DialogTitle>
          </DialogHeader>

          {editingFile && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select name="category" defaultValue={editingFile.category}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIA_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Tags (comma-separated)</Label>
                <Input
                  name="tags"
                  defaultValue={parseTags(editingFile.tags).join(", ")}
                  placeholder="morning, upbeat, intro"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
