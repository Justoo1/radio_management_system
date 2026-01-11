import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { streamControlSchema, queueAddSchema } from "@/lib/validations/streaming.validation";

// POST /api/streaming/control - Control streaming (start, stop, restart, skip)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    if (!streamingConfig.azuracastStationId) {
      return NextResponse.json(
        { error: "Station not connected to streaming server" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = streamControlSchema.parse(body);

    const azuracastService = createAzuraCastService();
    let result: { success: boolean; message: string };

    switch (action) {
      case "start":
        await azuracastService.startStation(streamingConfig.azuracastStationId);
        await prisma.streamingConfig.update({
          where: { id: streamingConfig.id },
          data: { status: "ACTIVE", isEnabled: true },
        });
        result = { success: true, message: "Station started successfully" };
        break;

      case "stop":
        await azuracastService.stopStation(streamingConfig.azuracastStationId);
        await prisma.streamingConfig.update({
          where: { id: streamingConfig.id },
          data: { status: "INACTIVE", isEnabled: false },
        });
        result = { success: true, message: "Station stopped successfully" };
        break;

      case "restart":
        await azuracastService.restartStation(streamingConfig.azuracastStationId);
        result = { success: true, message: "Station restarted successfully" };
        break;

      case "skip":
        await azuracastService.skipSong(streamingConfig.azuracastStationId);
        result = { success: true, message: "Song skipped successfully" };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "STREAM_CONTROL",
        resource: "streaming",
        resourceId: streamingConfig.id,
        description: `Stream control action: ${action}`,
      },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error controlling stream:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to control stream" },
      { status: 500 }
    );
  }
}

// PUT /api/streaming/control - Add song to queue
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    if (!streamingConfig.azuracastStationId) {
      return NextResponse.json(
        { error: "Station not connected to streaming server" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { mediaFileId, azuracastMediaId, playNow } = queueAddSchema.parse(body);

    const azuracastService = createAzuraCastService();

    // If mediaFileId provided, look up the AzuraCast media ID
    let targetMediaId = azuracastMediaId;

    if (mediaFileId && !targetMediaId) {
      // Find the media file and its AzuraCast ID
      const playlistSong = await prisma.streamPlaylistSong.findFirst({
        where: {
          mediaFileId,
          playlist: { streamingConfigId: streamingConfig.id },
        },
      });

      if (!playlistSong?.azuracastMediaId) {
        return NextResponse.json(
          { error: "Media file not found in streaming library" },
          { status: 404 }
        );
      }

      targetMediaId = playlistSong.azuracastMediaId;
    }

    if (!targetMediaId) {
      return NextResponse.json(
        { error: "No valid media ID provided" },
        { status: 400 }
      );
    }

    // Add to queue
    const queueItem = await azuracastService.addToQueue(
      streamingConfig.azuracastStationId,
      targetMediaId
    );

    return NextResponse.json({
      data: {
        success: true,
        message: playNow ? "Song added to play next" : "Song added to queue",
        queueItem,
      },
    });
  } catch (error) {
    console.error("Error adding to queue:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to add to queue" },
      { status: 500 }
    );
  }
}
