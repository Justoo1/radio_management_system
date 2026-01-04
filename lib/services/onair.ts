import prisma from '@/lib/prisma';
import { getRedis, REDIS_CHANNELS } from '@/lib/redis';
import { OnAirItemType, QueueItemStatus } from '@prisma/client';

// ============================================
// NOW PLAYING OPERATIONS
// ============================================

export interface NowPlayingData {
  itemType: OnAirItemType;
  itemId?: string;
  title: string;
  artist?: string;
  duration: number;
  thumbnailUrl?: string;
  audioUrl?: string;
  notes?: string;
  programId?: string;
  presenterId: string;
}

export async function startPlaying(organizationId: string, data: NowPlayingData) {
  const now = new Date();
  const endsAt = new Date(now.getTime() + data.duration * 1000);

  // Remove existing now playing if any
  await prisma.onAirNow.deleteMany({
    where: { organizationId },
  });

  // Create new now playing
  const onAirNow = await prisma.onAirNow.create({
    data: {
      organizationId,
      itemType: data.itemType,
      itemId: data.itemId,
      title: data.title,
      artist: data.artist,
      duration: data.duration,
      startedAt: now,
      endsAt,
      remainingSeconds: data.duration,
      thumbnailUrl: data.thumbnailUrl,
      audioUrl: data.audioUrl,
      notes: data.notes,
      programId: data.programId,
      presenterId: data.presenterId,
    },
  });

  // Cache in Redis (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.setex(
      `onair:now:${organizationId}`,
      data.duration,
      JSON.stringify(onAirNow)
    );

    // Publish to Redis channel
    await redis.publish(
      REDIS_CHANNELS.ON_AIR_NOW(organizationId),
      JSON.stringify({ action: 'start', data: onAirNow })
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }

  return onAirNow;
}

export async function getCurrentlyPlaying(organizationId: string) {
  // Try cache first with timeout (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    const cached = await Promise.race([
      redis.get(`onair:now:${organizationId}`),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
    ]) as string | null;

    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('[OnAir Service] Redis read failed, falling back to database:', error instanceof Error ? error.message : error);
  }

  // Fall back to database with optimized query
  try {
    const result = await prisma.onAirNow.findUnique({
      where: { organizationId },
      select: {
        id: true,
        itemType: true,
        itemId: true,
        title: true,
        artist: true,
        duration: true,
        startedAt: true,
        endsAt: true,
        remainingSeconds: true,
        thumbnailUrl: true,
        audioUrl: true,
        notes: true,
        programId: true,
        presenterId: true,
        presenter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return result;
  } catch (dbError) {
    console.error('[OnAir Service] Database query failed:', dbError);
    return null;
  }
}

export async function skipCurrentlyPlaying(organizationId: string) {
  await prisma.onAirNow.deleteMany({
    where: { organizationId },
  });

  // Clear cache (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.del(`onair:now:${organizationId}`);

    // Publish to Redis
    await redis.publish(
      REDIS_CHANNELS.ON_AIR_NOW(organizationId),
      JSON.stringify({ action: 'skip' })
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }

  return { success: true };
}

export async function updateRemainingTime(organizationId: string, remainingSeconds: number) {
  await prisma.onAirNow.update({
    where: { organizationId },
    data: { remainingSeconds },
  });

  // Publish timer update (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.publish(
      REDIS_CHANNELS.TIMER_UPDATE(organizationId),
      JSON.stringify({ remainingSeconds })
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }
}

// ============================================
// QUEUE OPERATIONS
// ============================================

export interface QueueItemData {
  itemType: OnAirItemType;
  itemId?: string;
  title: string;
  artist?: string;
  duration: number;
  position: number;
  thumbnailUrl?: string;
  audioUrl?: string;
  notes?: string;
  programId?: string;
  scheduledTime?: Date;
  autoPlay?: boolean;
}

export async function addToQueue(organizationId: string, data: QueueItemData) {
  const queueItem = await prisma.onAirQueue.create({
    data: {
      organizationId,
      ...data,
      status: QueueItemStatus.QUEUED,
    },
  });

  // Publish to Redis (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.publish(
      REDIS_CHANNELS.QUEUE_UPDATE(organizationId),
      JSON.stringify({ action: 'add', data: queueItem })
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }

  return queueItem;
}

export async function getQueue(organizationId: string) {
  return await prisma.onAirQueue.findMany({
    where: {
      organizationId,
      status: QueueItemStatus.QUEUED,
    },
    orderBy: {
      position: 'asc',
    },
  });
}

export async function updateQueuePositions(
  organizationId: string,
  items: Array<{ id: string; position: number }>
) {
  // Update all positions in a transaction
  await prisma.$transaction(
    items.map((item) =>
      prisma.onAirQueue.update({
        where: { id: item.id },
        data: { position: item.position },
      })
    )
  );

  // Publish to Redis (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.publish(
      REDIS_CHANNELS.QUEUE_UPDATE(organizationId),
      JSON.stringify({ action: 'reorder', data: items })
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }

  return { success: true };
}

export async function removeFromQueue(organizationId: string, queueItemId: string) {
  try {
    await prisma.onAirQueue.delete({
      where: { id: queueItemId },
    });

    // Reorder remaining items
    const remainingItems = await getQueue(organizationId);
    await updateQueuePositions(
      organizationId,
      remainingItems.map((item, index) => ({
        id: item.id,
        position: index + 1,
      }))
    );

    return { success: true };
  } catch (error: any) {
    // If item doesn't exist, just return success
    if (error.code === 'P2025') {
      console.warn(`Queue item ${queueItemId} not found, but returning success`);
      return { success: true };
    }
    throw error;
  }
}

export async function getNextInQueue(organizationId: string) {
  return await prisma.onAirQueue.findFirst({
    where: {
      organizationId,
      status: QueueItemStatus.QUEUED,
    },
    orderBy: {
      position: 'asc',
    },
  });
}

export async function playNextInQueue(organizationId: string, presenterId: string) {
  const nextItem = await getNextInQueue(organizationId);

  if (!nextItem) {
    return null;
  }

  // Mark as playing
  await prisma.onAirQueue.update({
    where: { id: nextItem.id },
    data: {
      status: QueueItemStatus.PLAYING,
      playedAt: new Date(),
    },
  });

  // Start playing
  const nowPlaying = await startPlaying(organizationId, {
    itemType: nextItem.itemType,
    itemId: nextItem.itemId || undefined,
    title: nextItem.title,
    artist: nextItem.artist || undefined,
    duration: nextItem.duration,
    thumbnailUrl: nextItem.thumbnailUrl || undefined,
    audioUrl: nextItem.audioUrl || undefined,
    notes: nextItem.notes || undefined,
    programId: nextItem.programId || undefined,
    presenterId,
  });

  // Mark as played after starting
  await prisma.onAirQueue.update({
    where: { id: nextItem.id },
    data: {
      status: QueueItemStatus.PLAYED,
    },
  });

  return nowPlaying;
}

// ============================================
// SONG OPERATIONS
// ============================================

export async function getSongs(organizationId: string, filters?: {
  genre?: string;
  rotation?: string;
  isActive?: boolean;
  search?: string;
}) {
  const where: any = { organizationId };

  if (filters) {
    if (filters.genre) where.genre = filters.genre;
    if (filters.rotation) where.rotation = filters.rotation;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { artist: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
  }

  return await prisma.song.findMany({
    where,
    orderBy: [
      { artist: 'asc' },
      { title: 'asc' },
    ],
  });
}

export async function getSong(songId: string) {
  return await prisma.song.findUnique({
    where: { id: songId },
    include: {
      playHistory: {
        orderBy: { playedAt: 'desc' },
        take: 10,
      },
    },
  });
}

export async function recordSongPlay(
  organizationId: string,
  songId: string,
  programId?: string,
  presenterId?: string
) {
  await prisma.songPlayHistory.create({
    data: {
      organizationId,
      songId,
      programId,
      presenterId,
      playedAt: new Date(),
    },
  });

  // Update song stats
  await prisma.song.update({
    where: { id: songId },
    data: {
      totalPlays: { increment: 1 },
      lastPlayedAt: new Date(),
    },
  });
}

// ============================================
// INSTANT AUDIO OPERATIONS
// ============================================

export async function getInstantAudios(organizationId: string) {
  return await prisma.instantAudio.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: {
      position: 'asc',
    },
  });
}

export async function playInstantAudio(instantAudioId: string) {
  await prisma.instantAudio.update({
    where: { id: instantAudioId },
    data: {
      totalPlays: { increment: 1 },
      lastPlayedAt: new Date(),
    },
  });
}

// ============================================
// LISTENER REQUEST OPERATIONS
// ============================================

export async function getListenerRequests(
  organizationId: string,
  status?: string
) {
  const where: any = { organizationId };
  if (status) where.status = status;

  return await prisma.listenerRequest.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

export async function createListenerRequest(data: {
  organizationId: string;
  listenerName?: string;
  listenerPhone: string;
  listenerEmail?: string;
  requestType: string;
  songTitle?: string;
  songArtist?: string;
  message?: string;
  source: string;
  programId?: string;
}) {
  const request = await prisma.listenerRequest.create({
    data: {
      organizationId: data.organizationId,
      listenerName: data.listenerName,
      listenerPhone: data.listenerPhone,
      listenerEmail: data.listenerEmail,
      requestType: data.requestType as any,
      songTitle: data.songTitle,
      songArtist: data.songArtist,
      message: data.message,
      source: data.source as any,
      programId: data.programId,
      status: 'PENDING' as any,
    },
  });

  // Publish to Redis (optional - don't fail if Redis is down)
  try {
    const redis = getRedis();
    await redis.publish(
      REDIS_CHANNELS.NEW_REQUEST(data.organizationId),
      JSON.stringify(request)
    );
  } catch (error) {
    console.warn('Redis operation failed, continuing without cache:', error instanceof Error ? error.message : error);
  }

  return request;
}

export async function approveListenerRequest(requestId: string) {
  return await prisma.listenerRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED' as any,
    },
  });
}

export async function rejectListenerRequest(requestId: string) {
  return await prisma.listenerRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED' as any,
    },
  });
}

// ============================================
// SHOW NOTES OPERATIONS
// ============================================

export async function getShowNotes(
  organizationId: string,
  showDate: Date,
  presenterId?: string
) {
  const where: any = {
    organizationId,
    showDate: {
      gte: new Date(showDate.setHours(0, 0, 0, 0)),
      lte: new Date(showDate.setHours(23, 59, 59, 999)),
    },
  };

  if (presenterId) where.presenterId = presenterId;

  return await prisma.showNote.findMany({
    where,
    orderBy: [
      { priority: 'desc' },
      { timeMarker: 'asc' },
    ],
  });
}

export async function createShowNote(data: {
  organizationId: string;
  presenterId: string;
  programId?: string;
  noteType: string;
  title?: string;
  content: string;
  showDate: Date;
  timeMarker?: string;
  priority?: string;
}) {
  return await prisma.showNote.create({
    data: {
      organizationId: data.organizationId,
      presenterId: data.presenterId,
      programId: data.programId,
      noteType: data.noteType as any,
      title: data.title,
      content: data.content,
      showDate: data.showDate,
      timeMarker: data.timeMarker,
      priority: data.priority as any,
      isCompleted: false,
    },
  });
}

export async function toggleShowNoteComplete(noteId: string) {
  const note = await prisma.showNote.findUnique({
    where: { id: noteId },
  });

  if (!note) throw new Error('Note not found');

  return await prisma.showNote.update({
    where: { id: noteId },
    data: {
      isCompleted: !note.isCompleted,
      completedAt: !note.isCompleted ? new Date() : null,
    },
  });
}

// ============================================
// PROGRAM MANAGEMENT HELPERS
// ============================================

/**
 * Get today's scheduled programs for an organization
 * @param organizationId - Organization ID
 * @returns Array of programs scheduled for today
 */
export async function getTodaysScheduledPrograms(organizationId: string) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  return await prisma.programSchedule.findMany({
    where: {
      program: {
        organizationId,
        isActive: true,
      },
      dayOfWeek,
      isActive: true,
    },
    include: {
      program: {
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  });
}

/**
 * Start broadcasting a program
 * @param organizationId - Organization ID
 * @param programId - Program ID
 * @param presenterId - Presenter/Host ID
 * @param scheduledDuration - Optional duration in minutes from the schedule
 * @returns OnAirNow record
 */
export async function startProgram(
  organizationId: string,
  programId: string,
  presenterId: string,
  scheduledDuration?: number
) {
  // Get program details
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      host: true,
    },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  // Verify program belongs to organization (security check)
  if (program.organizationId !== organizationId) {
    throw new Error('Unauthorized: Program does not belong to your organization');
  }

  // Update program status to LIVE
  await prisma.program.update({
    where: { id: programId },
    data: { status: 'LIVE' },
  });

  // Use scheduled duration if provided, otherwise use program duration
  const durationInSeconds = (scheduledDuration ?? program.duration) * 60;

  // Start the program
  return await startPlaying(organizationId, {
    itemType: 'PROGRAM',
    itemId: programId,
    title: program.name,
    artist: program.host?.name || 'Unknown Host',
    duration: durationInSeconds,
    thumbnailUrl: program.thumbnailUrl || undefined,
    notes: program.description || undefined,
    programId,
    presenterId,
  });
}

/**
 * Add program to queue (for upcoming programs)
 * @param organizationId - Organization ID
 * @param programId - Program ID
 * @param position - Queue position
 * @param scheduledTime - Optional scheduled time
 * @returns Queue item
 */
export async function addProgramToQueue(
  organizationId: string,
  programId: string,
  position: number,
  scheduledTime?: Date
) {
  // Get program details
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      host: true,
    },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  // Update program status to SCHEDULED if it was in DRAFT
  if (program.status === 'DRAFT') {
    await prisma.program.update({
      where: { id: programId },
      data: { status: 'SCHEDULED' },
    });
  }

  // Add to queue
  return await addToQueue(organizationId, {
    itemType: 'PROGRAM',
    itemId: programId,
    title: program.name,
    artist: program.host?.name || 'Unknown Host',
    duration: program.duration * 60, // Convert minutes to seconds
    position,
    thumbnailUrl: program.thumbnailUrl || undefined,
    notes: program.description || undefined,
    programId,
    scheduledTime,
    autoPlay: true,
  });
}

/**
 * Get current on-air program with full details
 * @param organizationId - Organization ID
 * @returns Current program or null
 */
export async function getCurrentProgram(organizationId: string) {
  const onAir = await getCurrentlyPlaying(organizationId);

  if (!onAir || onAir.itemType !== 'PROGRAM') {
    return null;
  }

  return onAir;
}

/**
 * Mark program as completed and trigger next in queue
 * @param organizationId - Organization ID
 * @returns Next program to play or null
 */
export async function completeProgramAndPlayNext(organizationId: string) {
  // Skip current program
  await skipCurrentlyPlaying(organizationId);

  // Get next in queue
  const queue = await getQueue(organizationId);

  if (queue.length === 0) {
    return null;
  }

  const nextItem = queue[0];

  // If it's a program, play it
  if (nextItem.itemType === 'PROGRAM' && nextItem.programId) {
    // Remove from queue
    await removeFromQueue(organizationId, nextItem.id);

    // Get the presenter (use program host by default)
    const program = await prisma.program.findUnique({
      where: { id: nextItem.programId },
      select: { hostId: true },
    });

    if (program?.hostId) {
      return await startProgram(organizationId, nextItem.programId, program.hostId);
    }
  }

  return null;
}
