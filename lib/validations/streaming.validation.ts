import { z } from "zod";

// ============================================
// Streaming Configuration Schemas
// ============================================

export const streamingConfigCreateSchema = z.object({
  stationName: z
    .string()
    .min(2, "Station name must be at least 2 characters")
    .max(100, "Station name must not exceed 100 characters"),
  stationDescription: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  genre: z.string().max(50, "Genre must not exceed 50 characters").optional(),
  timezone: z.string().default("Africa/Accra"),
});

export const streamingConfigUpdateSchema = streamingConfigCreateSchema.partial();

// ============================================
// Mount Point Schemas
// ============================================

export const mountPointCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Mount point name is required")
    .max(50, "Name must not exceed 50 characters"),
  mountPath: z
    .string()
    .min(1, "Mount path is required")
    .regex(/^\/[a-zA-Z0-9_.-]+$/, "Invalid mount path format (e.g., /radio.mp3)"),
  format: z.enum(["mp3", "ogg", "aac", "opus"]).default("mp3"),
  bitrate: z
    .number()
    .min(32, "Bitrate must be at least 32 kbps")
    .max(320, "Bitrate must not exceed 320 kbps")
    .default(128),
  isDefault: z.boolean().default(false),
  maxListeners: z.number().min(0).optional(),
  introFile: z.string().optional(),
  fallbackMount: z.string().optional(),
});

export const mountPointUpdateSchema = mountPointCreateSchema.partial();

// ============================================
// DJ Account Schemas
// ============================================

export const djAccountCreateSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must not exceed 50 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  userId: z.string().cuid().optional(),
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  scheduleDays: z.array(z.number().min(0).max(6)).optional(),
  enforceSchedule: z.boolean().default(false),
});

export const djAccountUpdateSchema = djAccountCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const djAccountPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password must not exceed 50 characters"),
});

// ============================================
// Playlist Schemas
// ============================================

// Schema for individual schedule items (matching AzuraCast format)
export const playlistScheduleItemSchema = z.object({
  startTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  endTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (use HH:MM)"),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Invalid date format (use YYYY-MM-DD)",
    }),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val))
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Invalid date format (use YYYY-MM-DD)",
    }),
  days: z
    .array(z.number().min(0).max(6))
    .optional()
    .describe("Day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday"),
  loopOnce: z
    .boolean()
    .default(false)
    .describe("Only loop through playlist once per schedule"),
});

export const playlistCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Playlist name is required")
    .max(100, "Name must not exceed 100 characters"),
  type: z.enum(["default", "scheduled", "once_per_hour", "once_per_day", "advanced"]).default("default"),
  weight: z.number().min(1).max(100).default(50),
  isEnabled: z.boolean().default(true),
  playPerHour: z.number().min(0).max(60).optional(),
  playPerDay: z.number().min(0).max(24).optional(),
  // Legacy schedule fields (for backward compatibility)
  scheduleStart: z.string().optional(),
  scheduleEnd: z.string().optional(),
  scheduleDays: z.array(z.number().min(0).max(6)).optional(),
  // New schedule items array (for full AzuraCast schedule support)
  scheduleItems: z
    .array(playlistScheduleItemSchema)
    .optional()
    .describe("Array of schedule items for scheduled playlists"),
  programId: z.string().cuid().optional(),
  includeInAutoDJ: z.boolean().default(true),
  avoidDuplicates: z.boolean().default(true),
});

export const playlistUpdateSchema = playlistCreateSchema.partial();

// ============================================
// Playlist Song Schemas
// ============================================

export const playlistSongAddSchema = z.object({
  mediaFileId: z.string().cuid("Invalid media file ID"),
  position: z.number().min(0).optional(),
});

export const playlistSongReorderSchema = z.object({
  songs: z.array(
    z.object({
      id: z.string().cuid(),
      position: z.number().min(0),
    })
  ),
});

// ============================================
// Stream Control Schemas
// ============================================

export const streamControlSchema = z.object({
  action: z.enum(["start", "stop", "restart", "skip"]),
});

export const queueAddSchema = z.object({
  mediaFileId: z.string().cuid().optional(),
  azuracastMediaId: z.number().optional(),
  playNow: z.boolean().default(false),
}).refine(
  (data) => data.mediaFileId || data.azuracastMediaId,
  "Either mediaFileId or azuracastMediaId is required"
);

// ============================================
// Listener Request Schemas
// ============================================

export const listenerRequestSchema = z.object({
  songTitle: z
    .string()
    .min(1, "Song title is required")
    .max(200, "Song title must not exceed 200 characters"),
  artistName: z.string().max(200, "Artist name must not exceed 200 characters").optional(),
  requesterName: z.string().max(100, "Name must not exceed 100 characters").optional(),
  requesterEmail: z.string().email("Invalid email address").optional(),
  message: z.string().max(500, "Message must not exceed 500 characters").optional(),
});

// ============================================
// Analytics Query Schemas
// ============================================

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  interval: z.enum(["hour", "day", "week", "month"]).default("day"),
  mountPointId: z.string().cuid().optional(),
});

export const listenerSessionQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  mountPointId: z.string().cuid().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

// ============================================
// Webhook Schemas
// ============================================

export const azuracastWebhookSchema = z.object({
  type: z.enum([
    "song_changed",
    "listener_gained",
    "listener_lost",
    "live_connect",
    "live_disconnect",
    "station_offline",
    "station_online",
  ]),
  station: z.object({
    id: z.number(),
    name: z.string(),
    shortcode: z.string().optional(),
  }),
  now_playing: z
    .object({
      song: z.object({
        id: z.string().optional(),
        title: z.string(),
        artist: z.string(),
        album: z.string().optional(),
        art: z.string().optional(),
      }).optional(),
      listeners: z.object({
        current: z.number(),
        unique: z.number().optional(),
        total: z.number().optional(),
      }).optional(),
      live: z.object({
        is_live: z.boolean(),
        streamer_name: z.string().optional(),
      }).optional(),
    })
    .optional(),
});

// ============================================
// Station Setup Schemas
// ============================================

export const stationSetupSchema = z.object({
  stationName: z
    .string()
    .min(2, "Station name must be at least 2 characters")
    .max(100, "Station name must not exceed 100 characters"),
  stationDescription: z.string().max(500).optional(),
  genre: z.string().max(50).optional(),
  timezone: z.string().default("Africa/Accra"),
  defaultFormat: z.enum(["mp3", "ogg", "aac", "opus"]).default("mp3"),
  defaultBitrate: z.number().min(32).max(320).default(128),
  enableAutoDJ: z.boolean().default(true),
  enableRequests: z.boolean().default(true),
});

// ============================================
// Media Upload Schemas
// ============================================

export const streamMediaUploadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  artist: z.string().max(200).optional(),
  album: z.string().max(200).optional(),
  genre: z.string().max(50).optional(),
  playlistIds: z.array(z.string().cuid()).optional(),
});

// ============================================
// Type Exports
// ============================================

export type StreamingConfigCreate = z.infer<typeof streamingConfigCreateSchema>;
export type StreamingConfigUpdate = z.infer<typeof streamingConfigUpdateSchema>;
export type MountPointCreate = z.infer<typeof mountPointCreateSchema>;
export type MountPointUpdate = z.infer<typeof mountPointUpdateSchema>;
export type DJAccountCreate = z.infer<typeof djAccountCreateSchema>;
export type DJAccountUpdate = z.infer<typeof djAccountUpdateSchema>;
export type DJAccountPassword = z.infer<typeof djAccountPasswordSchema>;
export type PlaylistCreate = z.infer<typeof playlistCreateSchema>;
export type PlaylistUpdate = z.infer<typeof playlistUpdateSchema>;
export type PlaylistSongAdd = z.infer<typeof playlistSongAddSchema>;
export type PlaylistSongReorder = z.infer<typeof playlistSongReorderSchema>;
export type StreamControl = z.infer<typeof streamControlSchema>;
export type QueueAdd = z.infer<typeof queueAddSchema>;
export type ListenerRequest = z.infer<typeof listenerRequestSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type ListenerSessionQuery = z.infer<typeof listenerSessionQuerySchema>;
export type AzuracastWebhook = z.infer<typeof azuracastWebhookSchema>;
export type StationSetup = z.infer<typeof stationSetupSchema>;
export type StreamMediaUpload = z.infer<typeof streamMediaUploadSchema>;
