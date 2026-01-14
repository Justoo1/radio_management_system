import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { playlistUpdateSchema } from "@/lib/validations/streaming.validation";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/streaming/playlists/[id] - Get single playlist
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
        program: {
          select: { id: true, name: true },
        },
        songs: {
          include: {
            mediaFile: {
              select: { id: true, name: true, duration: true, url: true },
            },
          },
          orderBy: { position: "asc" },
        },
        _count: { select: { songs: true } },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    return NextResponse.json({ data: playlist });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist" },
      { status: 500 }
    );
  }
}

// PATCH /api/streaming/playlists/[id] - Update playlist
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = playlistUpdateSchema.parse(body);

    // Update in AzuraCast if connected
    if (playlist.streamingConfig.azuracastStationId && playlist.azuracastPlaylistId) {
      try {
        const azuracastService = createAzuraCastService();

        type AzuracastPlaylistType = "default" | "once_per_hour" | "advanced" | "once_per_x_songs" | "once_per_x_minutes";
        const typeMap: Record<string, AzuracastPlaylistType> = {
          default: "default",
          scheduled: "default",
          once_per_hour: "once_per_hour",
          once_per_day: "once_per_x_songs",
          advanced: "advanced",
        };

        await azuracastService.updatePlaylist(
          playlist.streamingConfig.azuracastStationId,
          playlist.azuracastPlaylistId,
          {
            name: validatedData.name,
            type: validatedData.type ? typeMap[validatedData.type] : undefined,
            weight: validatedData.weight,
            isEnabled: validatedData.isEnabled,
          }
        );
      } catch (azuraError) {
        console.error("AzuraCast playlist update failed:", azuraError);
      }
    }

    // Map type to Prisma enum
    const prismaTypeMap: Record<string, "DEFAULT" | "SCHEDULED" | "ONCE_PER_HOUR" | "ONCE_PER_DAY" | "JINGLES" | "REQUESTS"> = {
      default: "DEFAULT",
      scheduled: "SCHEDULED",
      once_per_hour: "ONCE_PER_HOUR",
      once_per_day: "ONCE_PER_DAY",
      advanced: "DEFAULT",
    };

    // Update in database
    const updatedPlaylist = await prisma.streamPlaylist.update({
      where: { id },
      data: {
        name: validatedData.name,
        type: validatedData.type ? prismaTypeMap[validatedData.type] : undefined,
        weight: validatedData.weight,
        isEnabled: validatedData.isEnabled,
        scheduledStartTime: validatedData.scheduleStart,
        scheduledEndTime: validatedData.scheduleEnd,
        scheduledDays: validatedData.scheduleDays ? JSON.stringify(validatedData.scheduleDays) : undefined,
        programId: validatedData.programId,
      },
      include: {
        program: {
          select: { id: true, name: true },
        },
        _count: { select: { songs: true } },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "UPDATE",
        resource: "stream_playlist",
        resourceId: id,
        description: `Updated playlist: ${validatedData.name || playlist.name}`,
      },
    });

    return NextResponse.json({ data: updatedPlaylist });
  } catch (error) {
    console.error("Error updating playlist:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update playlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/playlists/[id] - Delete playlist
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
    if (!hasPermission(session.user, "streaming", "delete")) {
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
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Delete from AzuraCast if connected
    console.log("Checking AzuraCast deletion:", {
      stationId: playlist.streamingConfig.azuracastStationId,
      playlistId: playlist.azuracastPlaylistId,
    });

    if (playlist.streamingConfig.azuracastStationId && playlist.azuracastPlaylistId) {
      try {
        console.log(`Deleting playlist ${playlist.azuracastPlaylistId} from AzuraCast station ${playlist.streamingConfig.azuracastStationId}`);
        const azuracastService = createAzuraCastService();
        await azuracastService.deletePlaylist(
          playlist.streamingConfig.azuracastStationId,
          playlist.azuracastPlaylistId
        );
        console.log("AzuraCast playlist deleted successfully");
      } catch (azuraError) {
        console.error("AzuraCast playlist deletion failed:", azuraError);
        // Continue with local deletion even if AzuraCast fails
      }
    } else {
      console.log("Skipping AzuraCast deletion - no azuracastPlaylistId stored for this playlist");
    }

    // Delete from database (cascade will delete playlist songs)
    await prisma.streamPlaylist.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "DELETE",
        resource: "stream_playlist",
        resourceId: id,
        description: `Deleted playlist: ${playlist.name}`,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { error: "Failed to delete playlist" },
      { status: 500 }
    );
  }
}
