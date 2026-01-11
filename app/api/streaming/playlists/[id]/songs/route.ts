import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import {
  playlistSongAddSchema,
  playlistSongReorderSchema,
} from "@/lib/validations/streaming.validation";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/streaming/playlists/[id]/songs - List songs in playlist
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    const playlist = await prisma.streamPlaylist.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
      include: {
        songs: {
          include: {
            mediaFile: {
              select: {
                id: true,
                name: true,
                duration: true,
                url: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ data: playlist.songs });
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist songs" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/playlists/[id]/songs - Add song to playlist
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get playlist with streaming config
    const playlist = await prisma.streamPlaylist.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
      include: {
        streamingConfig: true,
        songs: {
          orderBy: { position: "desc" },
          take: 1,
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = await request.json();
    const { mediaFileId, position } = playlistSongAddSchema.parse(body);

    // Verify the media file belongs to this organization
    const mediaFile = await prisma.mediaFile.findFirst({
      where: {
        id: mediaFileId,
        organizationId,
      },
    });

    if (!mediaFile) {
      return NextResponse.json({ error: "Media file not found" }, { status: 404 });
    }

    // Check if already in playlist
    const existingSong = await prisma.streamPlaylistSong.findFirst({
      where: {
        playlistId: id,
        mediaFileId,
      },
    });

    if (existingSong) {
      return NextResponse.json(
        { error: "Song already in playlist" },
        { status: 400 }
      );
    }

    // Calculate position
    const newPosition = position ?? (playlist.songs[0]?.position ?? 0) + 1;

    let azuracastMediaId: number | null = null;

    // Add to AzuraCast playlist if connected
    if (
      playlist.streamingConfig.azuracastStationId &&
      playlist.azuracastPlaylistId &&
      mediaFile.url
    ) {
      try {
        const azuracastService = createAzuraCastService();

        // First, check if media exists in AzuraCast or upload it
        const mediaList = await azuracastService.getMediaLibrary(
          playlist.streamingConfig.azuracastStationId
        );

        // Try to find existing media by name match
        const existingMedia = mediaList.find(
          (m) =>
            m.title?.toLowerCase() === mediaFile.name?.toLowerCase()
        );

        if (existingMedia) {
          azuracastMediaId = existingMedia.id;
        }

        // Add to AzuraCast playlist
        if (azuracastMediaId) {
          await azuracastService.addMediaToPlaylist(
            playlist.streamingConfig.azuracastStationId,
            playlist.azuracastPlaylistId,
            azuracastMediaId
          );
        }
      } catch (azuraError) {
        console.error("AzuraCast add to playlist failed:", azuraError);
      }
    }

    // Add to database
    const playlistSong = await prisma.streamPlaylistSong.create({
      data: {
        playlistId: id,
        mediaFileId,
        azuracastMediaId,
        title: mediaFile.name,
        duration: mediaFile.duration,
        position: newPosition,
      },
      include: {
        mediaFile: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "ADD_TO_PLAYLIST",
        resource: "stream_playlist",
        resourceId: id,
        description: `Added "${mediaFile.name}" to playlist`,
      },
    });

    return NextResponse.json({ data: playlistSong }, { status: 201 });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to add song to playlist" },
      { status: 500 }
    );
  }
}

// PATCH /api/streaming/playlists/[id]/songs - Reorder songs in playlist
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Verify playlist ownership
    const playlist = await prisma.streamPlaylist.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = await request.json();
    const { songs } = playlistSongReorderSchema.parse(body);

    // Update positions in transaction
    await prisma.$transaction(
      songs.map((song) =>
        prisma.streamPlaylistSong.update({
          where: { id: song.id },
          data: { position: song.position },
        })
      )
    );

    // Fetch updated list
    const updatedSongs = await prisma.streamPlaylistSong.findMany({
      where: { playlistId: id },
      include: {
        mediaFile: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ data: updatedSongs });
  } catch (error) {
    console.error("Error reordering playlist songs:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to reorder playlist songs" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/playlists/[id]/songs - Remove song from playlist
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");

    if (!songId) {
      return NextResponse.json(
        { error: "Song ID is required" },
        { status: 400 }
      );
    }

    // Get playlist song with playlist info
    const playlistSong = await prisma.streamPlaylistSong.findFirst({
      where: {
        id: songId,
        playlistId: id,
        playlist: {
          streamingConfig: { organizationId },
        },
      },
      include: {
        playlist: {
          include: { streamingConfig: true },
        },
        mediaFile: {
          select: { name: true },
        },
      },
    });

    if (!playlistSong) {
      return NextResponse.json({ error: "Song not found in playlist" }, { status: 404 });
    }

    // Remove from AzuraCast if connected
    if (
      playlistSong.playlist.streamingConfig.azuracastStationId &&
      playlistSong.playlist.azuracastPlaylistId &&
      playlistSong.azuracastMediaId
    ) {
      try {
        const azuracastService = createAzuraCastService();
        await azuracastService.removeMediaFromPlaylist(
          playlistSong.playlist.streamingConfig.azuracastStationId,
          playlistSong.playlist.azuracastPlaylistId,
          playlistSong.azuracastMediaId
        );
      } catch (azuraError) {
        console.error("AzuraCast remove from playlist failed:", azuraError);
      }
    }

    // Delete from database
    await prisma.streamPlaylistSong.delete({ where: { id: songId } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "REMOVE_FROM_PLAYLIST",
        resource: "stream_playlist",
        resourceId: id,
        description: `Removed "${playlistSong.mediaFile?.name || 'Unknown'}" from playlist`,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    return NextResponse.json(
      { error: "Failed to remove song from playlist" },
      { status: 500 }
    );
  }
}
