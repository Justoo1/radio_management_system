-- CreateEnum
CREATE TYPE "OnAirItemType" AS ENUM ('SONG', 'AD', 'JINGLE', 'SEGMENT', 'VOICETRACK', 'TALK_BREAK', 'STATION_ID');

-- CreateEnum
CREATE TYPE "QueueItemStatus" AS ENUM ('QUEUED', 'PLAYING', 'PLAYED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "SongRotation" AS ENUM ('POWER', 'MEDIUM', 'LIGHT', 'GOLD', 'RECURRENT');

-- CreateEnum
CREATE TYPE "InstantAudioType" AS ENUM ('JINGLE', 'SOUND_EFFECT', 'STATION_ID', 'SWEEPER', 'PROMO', 'LINER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('SONG_REQUEST', 'DEDICATION', 'SHOUTOUT', 'QUESTION', 'COMMENT', 'CONTEST_ENTRY');

-- CreateEnum
CREATE TYPE "RequestSource" AS ENUM ('SMS', 'WHATSAPP', 'PHONE', 'WEBSITE', 'MOBILE_APP', 'SOCIAL_MEDIA');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'PLAYED', 'READ_ON_AIR', 'REJECTED', 'SPAM');

-- CreateEnum
CREATE TYPE "ShowNoteType" AS ENUM ('REMINDER', 'TALKING_POINT', 'SPONSOR_READ', 'GUEST_INFO', 'CONTEST_DETAIL', 'WEATHER', 'TRAFFIC', 'NEWS_ITEM', 'TECHNICAL_NOTE');

-- CreateEnum
CREATE TYPE "NotePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PlaylistType" AS ENUM ('MANUAL', 'SMART', 'TIME_BASED', 'DAY_BASED', 'MOOD_BASED');

-- CreateEnum
CREATE TYPE "ListenerPlatform" AS ENUM ('WEB', 'MOBILE_APP', 'SMART_SPEAKER', 'CAR_RADIO', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'STICKER', 'LOCATION', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "WhatsAppMessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED', 'PENDING');

-- CreateTable
CREATE TABLE "on_air_now" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemType" "OnAirItemType" NOT NULL,
    "itemId" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "remainingSeconds" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "audioUrl" TEXT,
    "notes" TEXT,
    "programId" TEXT,
    "presenterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "on_air_now_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "on_air_queue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "itemType" "OnAirItemType" NOT NULL,
    "itemId" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "duration" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "scheduledTime" TIMESTAMP(3),
    "thumbnailUrl" TEXT,
    "audioUrl" TEXT,
    "notes" TEXT,
    "status" "QueueItemStatus" NOT NULL DEFAULT 'QUEUED',
    "playedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "skipReason" TEXT,
    "programId" TEXT,
    "autoPlay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "on_air_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "language" TEXT,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileSize" INTEGER,
    "releaseYear" INTEGER,
    "isrc" TEXT,
    "thumbnailUrl" TEXT,
    "mood" TEXT,
    "tempo" TEXT,
    "era" TEXT,
    "rotation" "SongRotation" NOT NULL DEFAULT 'MEDIUM',
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "playRestrictions" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instant_audio" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "audioUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" "InstantAudioType" NOT NULL,
    "category" TEXT,
    "buttonColor" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL,
    "hotkey" TEXT,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instant_audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "listenerName" TEXT,
    "listenerPhone" TEXT NOT NULL,
    "listenerEmail" TEXT,
    "requestType" "RequestType" NOT NULL,
    "songTitle" TEXT,
    "songArtist" TEXT,
    "message" TEXT,
    "source" "RequestSource" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "programId" TEXT,
    "playedAt" TIMESTAMP(3),
    "readOnAirAt" TIMESTAMP(3),
    "presenterNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "show_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "programId" TEXT,
    "presenterId" TEXT NOT NULL,
    "noteType" "ShowNoteType" NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "showDate" TIMESTAMP(3) NOT NULL,
    "timeMarker" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" "NotePriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "show_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PlaylistType" NOT NULL,
    "rules" TEXT,
    "shuffle" BOOLEAN NOT NULL DEFAULT false,
    "avoidRepeats" BOOLEAN NOT NULL DEFAULT true,
    "repeatMinutes" INTEGER NOT NULL DEFAULT 120,
    "timeRestrictions" TEXT,
    "totalPlays" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_songs" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_play_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programId" TEXT,
    "presenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_play_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "platform" "ListenerPlatform" NOT NULL,
    "deviceType" TEXT,
    "programId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listener_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "hour" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "currentListeners" INTEGER NOT NULL DEFAULT 0,
    "peakListeners" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "avgDuration" INTEGER NOT NULL DEFAULT 0,
    "songRequests" INTEGER NOT NULL DEFAULT 0,
    "whatsappMessages" INTEGER NOT NULL DEFAULT 0,
    "smsMessages" INTEGER NOT NULL DEFAULT 0,
    "programId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listener_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "businessAccountId" TEXT NOT NULL,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'PENDING',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "messagingLimit" TEXT,
    "monthlyMessages" INTEGER NOT NULL DEFAULT 0,
    "webhookSecret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappMessageId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "messageType" "WhatsAppMessageType" NOT NULL,
    "text" TEXT,
    "mediaUrl" TEXT,
    "caption" TEXT,
    "status" "WhatsAppMessageStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "conversationId" TEXT,
    "isReply" BOOLEAN NOT NULL DEFAULT false,
    "replyToMessageId" TEXT,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "processedAs" TEXT,
    "linkedRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "on_air_now_organizationId_key" ON "on_air_now"("organizationId");

-- CreateIndex
CREATE INDEX "on_air_now_organizationId_idx" ON "on_air_now"("organizationId");

-- CreateIndex
CREATE INDEX "on_air_queue_organizationId_position_idx" ON "on_air_queue"("organizationId", "position");

-- CreateIndex
CREATE INDEX "on_air_queue_organizationId_status_idx" ON "on_air_queue"("organizationId", "status");

-- CreateIndex
CREATE INDEX "songs_organizationId_idx" ON "songs"("organizationId");

-- CreateIndex
CREATE INDEX "songs_artist_idx" ON "songs"("artist");

-- CreateIndex
CREATE INDEX "songs_genre_idx" ON "songs"("genre");

-- CreateIndex
CREATE INDEX "songs_rotation_idx" ON "songs"("rotation");

-- CreateIndex
CREATE INDEX "songs_lastPlayedAt_idx" ON "songs"("lastPlayedAt");

-- CreateIndex
CREATE INDEX "instant_audio_organizationId_idx" ON "instant_audio"("organizationId");

-- CreateIndex
CREATE INDEX "instant_audio_type_idx" ON "instant_audio"("type");

-- CreateIndex
CREATE INDEX "instant_audio_position_idx" ON "instant_audio"("position");

-- CreateIndex
CREATE INDEX "listener_requests_organizationId_idx" ON "listener_requests"("organizationId");

-- CreateIndex
CREATE INDEX "listener_requests_status_idx" ON "listener_requests"("status");

-- CreateIndex
CREATE INDEX "listener_requests_listenerPhone_idx" ON "listener_requests"("listenerPhone");

-- CreateIndex
CREATE INDEX "listener_requests_createdAt_idx" ON "listener_requests"("createdAt");

-- CreateIndex
CREATE INDEX "show_notes_organizationId_idx" ON "show_notes"("organizationId");

-- CreateIndex
CREATE INDEX "show_notes_programId_idx" ON "show_notes"("programId");

-- CreateIndex
CREATE INDEX "show_notes_presenterId_idx" ON "show_notes"("presenterId");

-- CreateIndex
CREATE INDEX "show_notes_showDate_idx" ON "show_notes"("showDate");

-- CreateIndex
CREATE INDEX "playlists_organizationId_idx" ON "playlists"("organizationId");

-- CreateIndex
CREATE INDEX "playlists_type_idx" ON "playlists"("type");

-- CreateIndex
CREATE INDEX "playlist_songs_playlistId_position_idx" ON "playlist_songs"("playlistId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_songs_playlistId_songId_key" ON "playlist_songs"("playlistId", "songId");

-- CreateIndex
CREATE INDEX "song_play_history_organizationId_playedAt_idx" ON "song_play_history"("organizationId", "playedAt");

-- CreateIndex
CREATE INDEX "song_play_history_songId_playedAt_idx" ON "song_play_history"("songId", "playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "listener_sessions_sessionId_key" ON "listener_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "listener_sessions_organizationId_idx" ON "listener_sessions"("organizationId");

-- CreateIndex
CREATE INDEX "listener_sessions_startedAt_idx" ON "listener_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "listener_sessions_programId_idx" ON "listener_sessions"("programId");

-- CreateIndex
CREATE INDEX "listener_metrics_organizationId_idx" ON "listener_metrics"("organizationId");

-- CreateIndex
CREATE INDEX "listener_metrics_timestamp_idx" ON "listener_metrics"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "listener_metrics_organizationId_timestamp_key" ON "listener_metrics"("organizationId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_accounts_organizationId_key" ON "whatsapp_accounts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_whatsappMessageId_key" ON "whatsapp_messages"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_organizationId_idx" ON "whatsapp_messages"("organizationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_fromNumber_idx" ON "whatsapp_messages"("fromNumber");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_timestamp_idx" ON "whatsapp_messages"("timestamp");

-- AddForeignKey
ALTER TABLE "on_air_now" ADD CONSTRAINT "on_air_now_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_air_now" ADD CONSTRAINT "on_air_now_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_air_now" ADD CONSTRAINT "on_air_now_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_air_queue" ADD CONSTRAINT "on_air_queue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "on_air_queue" ADD CONSTRAINT "on_air_queue_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instant_audio" ADD CONSTRAINT "instant_audio_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_requests" ADD CONSTRAINT "listener_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_requests" ADD CONSTRAINT "listener_requests_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_notes" ADD CONSTRAINT "show_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_notes" ADD CONSTRAINT "show_notes_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "show_notes" ADD CONSTRAINT "show_notes_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_songs" ADD CONSTRAINT "playlist_songs_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_play_history" ADD CONSTRAINT "song_play_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_play_history" ADD CONSTRAINT "song_play_history_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_play_history" ADD CONSTRAINT "song_play_history_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_play_history" ADD CONSTRAINT "song_play_history_presenterId_fkey" FOREIGN KEY ("presenterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_sessions" ADD CONSTRAINT "listener_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_sessions" ADD CONSTRAINT "listener_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_metrics" ADD CONSTRAINT "listener_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listener_metrics" ADD CONSTRAINT "listener_metrics_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
