import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { playlistCreateSchema } from "@/lib/validations/streaming.validation";

// GET /api/streaming/playlists - List playlists
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get streaming config with playlists
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      include: {
        playlists: {
          include: {
            program: {
              select: { id: true, name: true },
            },
            songs: {
              include: {
                mediaFile: {
                  select: { id: true, name: true, duration: true },
                },
              },
              orderBy: { position: "asc" },
            },
            _count: { select: { songs: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: streamingConfig.playlists });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/playlists - Create playlist
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "create")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config and check limits
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: { include: { plan: true } },
        streamingConfig: {
          include: { _count: { select: { playlists: true } } },
        },
      },
    });

    if (!organization?.streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    // Check playlist limit
    const maxPlaylists = organization.subscription?.plan?.maxStreamPlaylists || 5;
    if (organization.streamingConfig._count.playlists >= maxPlaylists) {
      return NextResponse.json(
        { error: `Playlist limit reached (${maxPlaylists}). Upgrade your plan for more.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = playlistCreateSchema.parse(body);

    let azuracastPlaylistId: number | null = null;

    // Create in AzuraCast if connected
    if (organization.streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();

        // Map playlist type to AzuraCast type
        const typeMap: Record<string, "default" | "once_per_x_songs" | "once_per_x_minutes" | "once_per_hour" | "advanced"> = {
          default: "default",
          scheduled: "once_per_hour",
          once_per_hour: "once_per_x_songs",
          once_per_day: "once_per_hour",
          advanced: "advanced",
        };

        const azPlaylist = await azuracastService.createPlaylist(
          organization.streamingConfig.azuracastStationId,
          {
            name: validatedData.name,
            type: typeMap[validatedData.type] || "default",
            weight: validatedData.weight,
            isEnabled: validatedData.isEnabled,
          }
        );
        azuracastPlaylistId = azPlaylist.id;
      } catch (azuraError) {
        console.error("AzuraCast playlist creation failed:", azuraError);
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

    // Create in database
    const playlist = await prisma.streamPlaylist.create({
      data: {
        streamingConfigId: organization.streamingConfig.id,
        azuracastPlaylistId,
        name: validatedData.name,
        type: prismaTypeMap[validatedData.type] || "DEFAULT",
        weight: validatedData.weight,
        isEnabled: validatedData.isEnabled,
        scheduledStartTime: validatedData.scheduleStart,
        scheduledEndTime: validatedData.scheduleEnd,
        scheduledDays: validatedData.scheduleDays ? JSON.stringify(validatedData.scheduleDays) : null,
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
        action: "CREATE",
        resource: "stream_playlist",
        resourceId: playlist.id,
        description: `Created streaming playlist: ${validatedData.name}`,
      },
    });

    return NextResponse.json({ data: playlist }, { status: 201 });
  } catch (error) {
    console.error("Error creating playlist:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
