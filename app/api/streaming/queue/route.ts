import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/queue - Get current queue
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

    // Get queue from AzuraCast
    const azuracastService = createAzuraCastService();
    const queue = await azuracastService.getQueue(streamingConfig.azuracastStationId);

    // Format queue items
    const formattedQueue = queue.map((item, index) => ({
      position: index + 1,
      song: {
        title: item.song?.title || "Unknown",
        artist: item.song?.artist || "Unknown",
        album: item.song?.album,
        art: item.song?.art,
      },
      playlist: item.playlist,
      cuedAt: item.cued_at,
      playedAt: item.played_at,
      duration: item.duration,
      isRequest: item.is_request,
    }));

    return NextResponse.json({ data: formattedQueue });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/queue - Add song to queue
export async function POST(request: NextRequest) {
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
    const { mediaId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: "Media ID is required" },
        { status: 400 }
      );
    }

    const azuracastService = createAzuraCastService();
    const result = await azuracastService.addToQueue(
      streamingConfig.azuracastStationId,
      mediaId
    );

    return NextResponse.json({
      data: {
        success: true,
        message: "Song added to queue",
        queueItem: result,
      },
    });
  } catch (error) {
    console.error("Error adding to queue:", error);
    return NextResponse.json(
      { error: "Failed to add to queue" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/queue - Clear queue or remove specific item
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    const azuracastService = createAzuraCastService();

    if (itemId) {
      // Remove specific item from queue
      await azuracastService.removeFromQueue(
        streamingConfig.azuracastStationId,
        parseInt(itemId)
      );
      return NextResponse.json({
        data: { success: true, message: "Item removed from queue" },
      });
    } else {
      // Clear entire queue
      await azuracastService.clearQueue(streamingConfig.azuracastStationId);
      return NextResponse.json({
        data: { success: true, message: "Queue cleared" },
      });
    }
  } catch (error) {
    console.error("Error managing queue:", error);
    return NextResponse.json(
      { error: "Failed to manage queue" },
      { status: 500 }
    );
  }
}
