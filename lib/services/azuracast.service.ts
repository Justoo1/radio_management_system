/**
 * AzuraCast Service
 *
 * Handles all communication with the AzuraCast streaming server API.
 * Used for managing stations, playlists, DJs, and retrieving streaming data.
 */

// ============================================
// TYPES
// ============================================

export interface AzuraCastConfig {
  baseUrl: string;
  apiKey: string;
}

export interface AzuraCastStation {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  frontend: string;
  backend: string;
  timezone: string;
  listen_url: string;
  url: string;
  public_player_url: string;
  playlist_pls_url: string;
  playlist_m3u_url: string;
  is_public: boolean;
  mounts: AzuraCastMount[];
  remotes: unknown[];
  hls_enabled: boolean;
  hls_url: string | null;
  hls_listeners: number;
}

export interface AzuraCastMount {
  id: number;
  name: string;
  url: string;
  bitrate: number;
  format: string;
  listeners: {
    total: number;
    unique: number;
    current: number;
  };
  path: string;
  is_default: boolean;
}

export interface AzuraCastNowPlaying {
  station: AzuraCastStation;
  listeners: {
    total: number;
    unique: number;
    current: number;
  };
  live: {
    is_live: boolean;
    streamer_name: string;
    broadcast_start: number | null;
    art: string | null;
  };
  now_playing: {
    sh_id: number;
    played_at: number;
    duration: number;
    playlist: string;
    streamer: string;
    is_request: boolean;
    song: AzuraCastSong;
    elapsed: number;
    remaining: number;
  };
  playing_next: {
    cued_at: number;
    played_at: number;
    duration: number;
    playlist: string;
    is_request: boolean;
    song: AzuraCastSong;
  } | null;
  song_history: AzuraCastSongHistory[];
  is_online: boolean;
  cache: string | null;
}

export interface AzuraCastSong {
  id: string;
  art: string;
  custom_fields: unknown[];
  text: string;
  artist: string;
  title: string;
  album: string;
  genre: string;
  isrc: string;
  lyrics: string;
}

export interface AzuraCastSongHistory {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request: boolean;
  song: AzuraCastSong;
}

export interface AzuraCastListener {
  ip: string;
  user_agent: string;
  hash: string;
  mount_is_local: boolean;
  mount_name: string;
  connected_on: number;
  connected_until: number;
  connected_time: number;
  device: {
    client: string;
    is_browser: boolean;
    is_mobile: boolean;
    is_bot: boolean;
  };
  location: {
    city: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
}

export interface StreamerScheduleItem {
  start_time: string;   // "14:00" (HH:MM format)
  end_time: string;     // "15:00" (HH:MM format)
  start_date: string;   // "2024-01-15" (YYYY-MM-DD format)
  end_date: string;     // "2024-01-15" (YYYY-MM-DD format)
  days: number[];       // 0=Sunday, 1=Monday, etc.
}

export interface AzuraCastStreamer {
  id: number;
  streamer_username: string;
  streamer_password: string;
  display_name: string;
  comments: string;
  is_active: boolean;
  enforce_schedule: boolean;
  schedule_items: StreamerScheduleItem[];
  links: {
    self: string;
  };
}

export interface AzuraCastPlaylist {
  id: number;
  name: string;
  type: string;
  source: string;
  order: string;
  remote_url: string | null;
  remote_type: string | null;
  remote_buffer: number;
  is_enabled: boolean;
  is_jingle: boolean;
  play_per_songs: number;
  play_per_minutes: number;
  play_per_hour_minute: number;
  weight: number;
  include_in_requests: boolean;
  include_in_on_demand: boolean;
  backend_options: string[];
  avoid_duplicates: boolean;
  played_at: number;
  queue_reset_at: number;
  schedule_items: unknown[];
  links: {
    self: string;
    toggle: string;
    clone: string;
    queue: string;
    import: string;
    reshuffle: string;
    applyto: string;
    empty: string;
  };
}

export interface AzuraCastMedia {
  id: string;
  unique_id: string;
  song_id: string;
  art_updated_at: number;
  path: string;
  length: number;
  length_text: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  isrc: string;
  lyrics: string;
  art: string;
  custom_fields: unknown[];
  links: {
    self: string;
    art: string;
    waveform: string;
    play: string;
  };
}

export interface CreateStationOptions {
  name: string;
  short_name?: string;
  shortName?: string;
  description?: string;
  genre?: string;
  timezone?: string;
  maxListeners?: number;
  storageQuotaMB?: number;
  enable_requests?: boolean;
  enable_on_demand?: boolean;
  enable_hls?: boolean;
}

export interface AzuraCastQueueItem {
  cued_at: number;
  played_at: number;
  duration: number;
  playlist: string;
  is_request: boolean;
  song?: AzuraCastSong;
}

export interface AzuraCastRequest {
  request_id: string;
  timestamp: number;
  ip?: string;
  song?: AzuraCastSong;
  track?: {
    title: string;
    artist: string;
    album?: string;
    art?: string;
  };
}

export interface AzuraCastMountPointCreate {
  name: string;
  display_name?: string;
  url: string;
  is_default?: boolean;
  max_listener_duration?: number;
  enable_autodj?: boolean;
  autodj_format?: string;
  autodj_bitrate?: number;
  intro_path?: string;
  fallback_mount?: string;
}

export interface AzuraCastMountPointResponse {
  id: number;
  name: string;
  url: string;
  listen_url?: string;
  is_default: boolean;
  listeners?: {
    current: number;
    unique: number;
    total: number;
  };
}

export interface CreateStreamerOptions {
  username: string;
  password: string;
  displayName: string;
  isActive?: boolean;
  comments?: string;
  enforceSchedule?: boolean;
  scheduleItems?: StreamerScheduleItem[];
}

export interface PlaylistScheduleItem {
  start_time: string;       // HH:MM format (required)
  end_time: string;         // HH:MM format (required)
  start_date?: string;      // YYYY-MM-DD format (optional, for date range)
  end_date?: string;        // YYYY-MM-DD format (optional, for date range)
  days?: number[];          // Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
  loop_once?: boolean;      // Only loop through playlist once per schedule
}

export interface CreatePlaylistOptions {
  name: string;
  type?: 'default' | 'once_per_x_songs' | 'once_per_x_minutes' | 'once_per_hour' | 'once_per_day' | 'advanced';
  source?: 'songs' | 'remote_url' | 'remote_playlist';
  order?: 'shuffle' | 'random' | 'sequential';
  isEnabled?: boolean;
  weight?: number;
  // Schedule items for 'once_per_day' (scheduled) playlists
  scheduleItems?: PlaylistScheduleItem[];
}

// ============================================
// SERVICE CLASS
// ============================================

class AzuraCastService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AzuraCastConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  /**
   * Make an authenticated API request to AzuraCast
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AzuraCast API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // ============================================
  // STATION MANAGEMENT
  // ============================================

  /**
   * Get all stations
   */
  async getStations(): Promise<AzuraCastStation[]> {
    return this.request<AzuraCastStation[]>('/api/stations');
  }

  /**
   * Get a specific station by ID
   */
  async getStation(stationId: number): Promise<AzuraCastStation> {
    return this.request<AzuraCastStation>(`/api/station/${stationId}`);
  }

  /**
   * Create a new station (requires admin API key)
   */
  async createStation(options: CreateStationOptions): Promise<AzuraCastStation> {
    const shortName = options.short_name || options.shortName || options.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    return this.request<AzuraCastStation>('/api/admin/stations', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        short_name: shortName,
        description: options.description || '',
        genre: options.genre || '',
        timezone: options.timezone || 'Africa/Accra',
        frontend_type: 'icecast',
        frontend_config: {
          max_listeners: options.maxListeners || 100,
        },
        backend_type: 'liquidsoap',
        enable_requests: options.enable_requests ?? true,
        enable_streamers: true,
        enable_public_page: true,
        enable_on_demand: options.enable_on_demand ?? false,
        enable_hls: options.enable_hls ?? false,
        media_storage_location_id: null,
      }),
    });
  }

  /**
   * Start a station
   */
  async startStation(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/frontend/start`, {
      method: 'POST',
    });
    await this.request(`/api/station/${stationId}/backend/start`, {
      method: 'POST',
    });
  }

  /**
   * Stop a station
   */
  async stopStation(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/frontend/stop`, {
      method: 'POST',
    });
    await this.request(`/api/station/${stationId}/backend/stop`, {
      method: 'POST',
    });
  }

  /**
   * Skip current song
   */
  async skipSong(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/backend/skip`, {
      method: 'POST',
    });
  }

  /**
   * Update a station
   */
  async updateStation(
    stationId: number,
    data: Partial<CreateStationOptions>
  ): Promise<AzuraCastStation> {
    return this.request<AzuraCastStation>(`/api/admin/stations/${stationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a station
   */
  async deleteStation(stationId: number): Promise<void> {
    await this.request(`/api/admin/stations/${stationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Restart a station
   */
  async restartStation(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/restart`, {
      method: 'POST',
    });
  }

  // ============================================
  // NOW PLAYING
  // ============================================

  /**
   * Get now playing info for all stations
   */
  async getAllNowPlaying(): Promise<AzuraCastNowPlaying[]> {
    return this.request<AzuraCastNowPlaying[]>('/api/nowplaying');
  }

  /**
   * Get now playing info for a specific station
   */
  async getNowPlaying(stationId: number): Promise<AzuraCastNowPlaying> {
    return this.request<AzuraCastNowPlaying>(`/api/nowplaying/${stationId}`);
  }

  // ============================================
  // LISTENERS
  // ============================================

  /**
   * Get current listeners for a station
   */
  async getListeners(stationId: number): Promise<AzuraCastListener[]> {
    return this.request<AzuraCastListener[]>(`/api/station/${stationId}/listeners`);
  }

  // ============================================
  // MOUNT POINTS
  // ============================================

  /**
   * Get all mount points for a station
   */
  async getMounts(stationId: number): Promise<AzuraCastMount[]> {
    return this.request<AzuraCastMount[]>(`/api/station/${stationId}/mounts`);
  }

  /**
   * Get mount points (alias for getMounts)
   */
  async getMountPoints(stationId: number): Promise<AzuraCastMountPointResponse[]> {
    return this.request<AzuraCastMountPointResponse[]>(`/api/station/${stationId}/mounts`);
  }

  /**
   * Create a new mount point
   */
  async createMountPoint(
    stationId: number,
    options: AzuraCastMountPointCreate
  ): Promise<AzuraCastMountPointResponse> {
    return this.request<AzuraCastMountPointResponse>(`/api/station/${stationId}/mounts`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Update a mount point
   */
  async updateMountPoint(
    stationId: number,
    mountId: number,
    data: Partial<AzuraCastMountPointCreate>
  ): Promise<AzuraCastMountPointResponse> {
    return this.request<AzuraCastMountPointResponse>(
      `/api/station/${stationId}/mount/${mountId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Delete a mount point
   */
  async deleteMountPoint(stationId: number, mountId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/mount/${mountId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // STREAMERS (DJ ACCOUNTS)
  // ============================================

  /**
   * Get all streamers for a station
   */
  async getStreamers(stationId: number): Promise<AzuraCastStreamer[]> {
    return this.request<AzuraCastStreamer[]>(`/api/station/${stationId}/streamers`);
  }

  /**
   * Get a specific streamer
   */
  async getStreamer(stationId: number, streamerId: number): Promise<AzuraCastStreamer> {
    return this.request<AzuraCastStreamer>(
      `/api/station/${stationId}/streamer/${streamerId}`
    );
  }

  /**
   * Create a new streamer (DJ account)
   * Supports schedule enforcement for time-limited access (e.g., airtime bookings)
   */
  async createStreamer(
    stationId: number,
    options: CreateStreamerOptions
  ): Promise<AzuraCastStreamer> {
    const payload: Record<string, unknown> = {
      streamer_username: options.username,
      streamer_password: options.password,
      display_name: options.displayName,
      is_active: options.isActive ?? true,
      comments: options.comments || '',
      enforce_schedule: options.enforceSchedule ?? false,
    };

    // Add schedule items if schedule enforcement is enabled
    if (options.enforceSchedule && options.scheduleItems) {
      payload.schedule_items = options.scheduleItems;
    }

    return this.request<AzuraCastStreamer>(`/api/station/${stationId}/streamers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update a streamer
   * Supports updating schedule enforcement settings
   */
  async updateStreamer(
    stationId: number,
    streamerId: number,
    data: Partial<CreateStreamerOptions>
  ): Promise<AzuraCastStreamer> {
    const body: Record<string, unknown> = {};
    if (data.username) body.streamer_username = data.username;
    if (data.password) body.streamer_password = data.password;
    if (data.displayName) body.display_name = data.displayName;
    if (data.isActive !== undefined) body.is_active = data.isActive;
    if (data.comments) body.comments = data.comments;
    if (data.enforceSchedule !== undefined) body.enforce_schedule = data.enforceSchedule;
    if (data.scheduleItems) body.schedule_items = data.scheduleItems;

    return this.request<AzuraCastStreamer>(
      `/api/station/${stationId}/streamer/${streamerId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    );
  }

  /**
   * Update streamer schedule
   * Convenience method for updating only the schedule of a streamer
   */
  async updateStreamerSchedule(
    stationId: number,
    streamerId: number,
    scheduleItems: StreamerScheduleItem[],
    enforceSchedule: boolean = true
  ): Promise<AzuraCastStreamer> {
    return this.updateStreamer(stationId, streamerId, {
      enforceSchedule,
      scheduleItems,
    });
  }

  /**
   * Disable streamer schedule enforcement
   * Useful for extending or removing time restrictions
   */
  async disableStreamerSchedule(
    stationId: number,
    streamerId: number
  ): Promise<AzuraCastStreamer> {
    return this.updateStreamer(stationId, streamerId, {
      enforceSchedule: false,
      scheduleItems: [],
    });
  }

  /**
   * Delete a streamer
   */
  async deleteStreamer(stationId: number, streamerId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/streamer/${streamerId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // PLAYLISTS
  // ============================================

  /**
   * Get all playlists for a station
   */
  async getPlaylists(stationId: number): Promise<AzuraCastPlaylist[]> {
    return this.request<AzuraCastPlaylist[]>(`/api/station/${stationId}/playlists`);
  }

  /**
   * Get a specific playlist
   */
  async getPlaylist(stationId: number, playlistId: number): Promise<AzuraCastPlaylist> {
    return this.request<AzuraCastPlaylist>(
      `/api/station/${stationId}/playlist/${playlistId}`
    );
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(
    stationId: number,
    options: CreatePlaylistOptions
  ): Promise<AzuraCastPlaylist> {
    // Build the payload
    const payload: Record<string, unknown> = {
      name: options.name,
      type: options.type || 'default',
      source: options.source || 'songs',
      order: options.order || 'shuffle',
      is_enabled: options.isEnabled ?? true,
      weight: options.weight || 3,
      include_in_requests: true,
      avoid_duplicates: true,
    };

    // Add schedule items for scheduled playlists
    if (options.scheduleItems && options.scheduleItems.length > 0) {
      payload.schedule_items = options.scheduleItems.map((item) => ({
        start_time: this.formatTimeForAzuraCast(item.start_time),
        end_time: this.formatTimeForAzuraCast(item.end_time),
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        days: item.days || [],
        loop_once: item.loop_once || false,
      }));
    }

    return this.request<AzuraCastPlaylist>(`/api/station/${stationId}/playlists`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Format time string to seconds since midnight for AzuraCast
   * AzuraCast expects time as seconds since midnight (0-86400)
   */
  private formatTimeForAzuraCast(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60);
  }

  /**
   * Update a playlist
   */
  async updatePlaylist(
    stationId: number,
    playlistId: number,
    data: Partial<CreatePlaylistOptions>
  ): Promise<AzuraCastPlaylist> {
    // Build the payload with proper formatting
    const payload: Record<string, unknown> = { ...data };

    // Format schedule items if provided
    if (data.scheduleItems && data.scheduleItems.length > 0) {
      payload.schedule_items = data.scheduleItems.map((item) => ({
        start_time: this.formatTimeForAzuraCast(item.start_time),
        end_time: this.formatTimeForAzuraCast(item.end_time),
        start_date: item.start_date || null,
        end_date: item.end_date || null,
        days: item.days || [],
        loop_once: item.loop_once || false,
      }));
      delete payload.scheduleItems;
    }

    // Convert camelCase to snake_case for AzuraCast API
    if ('isEnabled' in payload) {
      payload.is_enabled = payload.isEnabled;
      delete payload.isEnabled;
    }

    return this.request<AzuraCastPlaylist>(
      `/api/station/${stationId}/playlist/${playlistId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  }

  /**
   * Delete a playlist
   */
  async deletePlaylist(stationId: number, playlistId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/playlist/${playlistId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Toggle playlist enabled/disabled
   */
  async togglePlaylist(stationId: number, playlistId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/playlist/${playlistId}/toggle`, {
      method: 'PUT',
    });
  }

  // ============================================
  // MEDIA
  // ============================================

  /**
   * Get all media files for a station
   */
  async getMedia(stationId: number): Promise<AzuraCastMedia[]> {
    return this.request<AzuraCastMedia[]>(`/api/station/${stationId}/files`);
  }

  /**
   * Get media library (alias for getMedia)
   */
  async getMediaLibrary(stationId: number): Promise<Array<{
    id: number;
    unique_id?: string;
    title?: string;
    artist?: string;
    album?: string;
  }>> {
    return this.request(`/api/station/${stationId}/files`);
  }

  /**
   * Search media files
   */
  async searchMedia(stationId: number, query: string): Promise<Array<{
    id: number;
    unique_id?: string;
    title: string;
    artist: string;
    album?: string;
  }>> {
    const params = new URLSearchParams({ searchPhrase: query });
    return this.request(`/api/station/${stationId}/files?${params.toString()}`);
  }

  /**
   * Get a specific media file
   */
  async getMediaFile(stationId: number, mediaId: string): Promise<AzuraCastMedia> {
    return this.request<AzuraCastMedia>(`/api/station/${stationId}/file/${mediaId}`);
  }

  /**
   * Upload a media file
   * Note: This requires multipart/form-data handling
   */
  async uploadMedia(
    stationId: number,
    file: Blob,
    filename: string,
    path?: string
  ): Promise<AzuraCastMedia> {
    const formData = new FormData();
    formData.append('file', file, filename);
    if (path) {
      formData.append('path', path);
    }

    const url = `${this.baseUrl}/api/station/${stationId}/files`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AzuraCast upload error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Delete a media file
   */
  async deleteMedia(stationId: number, mediaId: string): Promise<void> {
    await this.request(`/api/station/${stationId}/file/${mediaId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Add media to a playlist
   */
  async addMediaToPlaylist(
    stationId: number,
    playlistId: number,
    mediaId: number
  ): Promise<void> {
    await this.request(`/api/station/${stationId}/playlist/${playlistId}/media`, {
      method: 'POST',
      body: JSON.stringify({ media_id: mediaId }),
    });
  }

  /**
   * Remove media from a playlist
   */
  async removeMediaFromPlaylist(
    stationId: number,
    playlistId: number,
    mediaId: number
  ): Promise<void> {
    await this.request(
      `/api/station/${stationId}/playlist/${playlistId}/media/${mediaId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ============================================
  // HISTORY
  // ============================================

  /**
   * Get song history for a station
   */
  async getSongHistory(
    stationId: number,
    start?: Date,
    end?: Date
  ): Promise<AzuraCastSongHistory[]> {
    let endpoint = `/api/station/${stationId}/history`;
    const params = new URLSearchParams();

    if (start) params.append('start', start.toISOString());
    if (end) params.append('end', end.toISOString());

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return this.request<AzuraCastSongHistory[]>(endpoint);
  }

  /**
   * Get recent station history (last N tracks)
   */
  async getStationHistory(stationId: number, limit: number = 10): Promise<AzuraCastSongHistory[]> {
    const history = await this.request<AzuraCastSongHistory[]>(
      `/api/station/${stationId}/history`
    );
    return history.slice(0, limit);
  }

  // ============================================
  // QUEUE
  // ============================================

  /**
   * Get upcoming queue for a station
   */
  async getQueue(stationId: number): Promise<AzuraCastQueueItem[]> {
    return this.request<AzuraCastQueueItem[]>(`/api/station/${stationId}/queue`);
  }

  /**
   * Add a song to the queue
   */
  async addToQueue(stationId: number, mediaId: number): Promise<AzuraCastQueueItem> {
    return this.request<AzuraCastQueueItem>(`/api/station/${stationId}/queue`, {
      method: 'POST',
      body: JSON.stringify({ media_id: mediaId }),
    });
  }

  /**
   * Remove a song from the queue
   */
  async removeFromQueue(stationId: number, queueId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/queue/${queueId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Clear the queue
   */
  async clearQueue(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/queue`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // REQUESTS
  // ============================================

  /**
   * Get requestable songs for a station
   */
  async getRequestableSongs(stationId: number): Promise<AzuraCastMedia[]> {
    return this.request<AzuraCastMedia[]>(`/api/station/${stationId}/requests`);
  }

  /**
   * Get pending requests for a station
   */
  async getRequests(stationId: number): Promise<AzuraCastRequest[]> {
    return this.request<AzuraCastRequest[]>(`/api/station/${stationId}/reports/requests`);
  }

  /**
   * Submit a song request
   */
  async submitRequest(stationId: number, mediaId: string): Promise<{ success: boolean }> {
    return this.request(`/api/station/${stationId}/request/${mediaId}`, {
      method: 'POST',
    });
  }

  /**
   * Delete a request
   */
  async deleteRequest(stationId: number, requestId: string): Promise<void> {
    await this.request(`/api/station/${stationId}/reports/requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Clear all requests
   */
  async clearRequests(stationId: number): Promise<void> {
    await this.request(`/api/station/${stationId}/reports/requests`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if AzuraCast server is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get server status
   */
  async getStatus(): Promise<{ online: boolean; timestamp: number }> {
    return this.request<{ online: boolean; timestamp: number }>('/api/status');
  }
}

// ============================================
// FACTORY & SINGLETON
// ============================================

let defaultServiceInstance: AzuraCastService | null = null;

/**
 * Create a new AzuraCast service instance
 * If no config is provided, uses environment variables
 */
export function createAzuraCastService(config?: AzuraCastConfig): AzuraCastService {
  if (config) {
    return new AzuraCastService(config);
  }

  // Use environment variables
  const baseUrl = process.env.AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;

  if (!baseUrl) {
    throw new Error('AZURACAST_URL environment variable is not set');
  }

  if (!apiKey) {
    throw new Error('AZURACAST_API_KEY environment variable is not set');
  }

  return new AzuraCastService({ baseUrl, apiKey });
}

/**
 * Get the default AzuraCast service instance using environment variables
 * Uses a singleton pattern for efficiency
 */
export function getAzuraCastService(): AzuraCastService {
  if (defaultServiceInstance) {
    return defaultServiceInstance;
  }

  const baseUrl = process.env.AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;

  if (!baseUrl) {
    throw new Error('AZURACAST_URL environment variable is not set');
  }

  if (!apiKey) {
    throw new Error('AZURACAST_API_KEY environment variable is not set');
  }

  defaultServiceInstance = new AzuraCastService({ baseUrl, apiKey });
  return defaultServiceInstance;
}

// Default export
export default AzuraCastService;
