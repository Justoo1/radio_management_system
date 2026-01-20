import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { playlistCreateSchema } from "@/lib/validations/streaming.validation";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/playlists - List playlists
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check streaming feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.STREAMING);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Streaming feature is not enabled for your organization. Please upgrade your plan." },
        { status: 403 }
      );
    }

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
        // Note: "scheduled" in our system uses "default" type with schedule_items in AzuraCast
        const typeMap: Record<string, "default" | "once_per_x_songs" | "once_per_x_minutes" | "once_per_hour" | "once_per_day" | "advanced"> = {
          default: "default",
          scheduled: "default", // Scheduled playlists use default type with schedule_items
          once_per_hour: "once_per_hour",
          once_per_day: "once_per_day",
          advanced: "advanced",
        };

        // Build schedule items for AzuraCast if this is a scheduled playlist
        const scheduleItems = validatedData.type === "scheduled" && validatedData.scheduleItems
          ? validatedData.scheduleItems.map((item: {
              startTime: string;
              endTime: string;
              startDate?: string;
              endDate?: string;
              days?: number[];
              loopOnce?: boolean;
            }) => ({
              start_time: item.startTime,
              end_time: item.endTime,
              start_date: item.startDate,
              end_date: item.endDate,
              days: item.days || [],
              loop_once: item.loopOnce || false,
            }))
          : undefined;

        const playlistOptions = {
          name: validatedData.name,
          type: typeMap[validatedData.type] || "default",
          weight: validatedData.weight,
          isEnabled: validatedData.isEnabled,
          scheduleItems,
        };

        console.log("Creating AzuraCast playlist with options:", JSON.stringify(playlistOptions, null, 2));

        const azPlaylist = await azuracastService.createPlaylist(
          organization.streamingConfig.azuracastStationId,
          playlistOptions
        );
        azuracastPlaylistId = azPlaylist.id;
        console.log("AzuraCast playlist created with ID:", azuracastPlaylistId);
      } catch (azuraError) {
        console.error("AzuraCast playlist creation failed:", azuraError);
        // Log the full error details
        if (azuraError instanceof Error) {
          console.error("Error message:", azuraError.message);
        }
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
    // For scheduled playlists, store schedule items as JSON in scheduledDays field
    // The first schedule item's times are stored in dedicated fields for quick access
    const firstScheduleItem = validatedData.scheduleItems?.[0];

    const playlist = await prisma.streamPlaylist.create({
      data: {
        streamingConfigId: organization.streamingConfig.id,
        azuracastPlaylistId,
        name: validatedData.name,
        type: prismaTypeMap[validatedData.type] || "DEFAULT",
        weight: validatedData.weight,
        isEnabled: validatedData.isEnabled,
        scheduledStartTime: firstScheduleItem?.startTime || validatedData.scheduleStart,
        scheduledEndTime: firstScheduleItem?.endTime || validatedData.scheduleEnd,
        scheduledDays: validatedData.scheduleItems
          ? JSON.stringify(validatedData.scheduleItems)
          : validatedData.scheduleDays
            ? JSON.stringify(validatedData.scheduleDays)
            : null,
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

    // Handle Zod validation errors
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as { issues?: Array<{ path: (string | number)[]; message: string }> };
      const details = zodError.issues?.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })) || [];

      // Create a user-friendly error message
      const errorMessage = details.length > 0
        ? `Validation failed: ${details.map(d => d.message).join(", ")}`
        : "Invalid input data";

      return NextResponse.json({
        error: errorMessage,
        details,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create playlist" },
      { status: 500 }
    );
  }
}
