import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { listenerRequestSchema } from "@/lib/validations/streaming.validation";

// GET /api/streaming/requests - Get listener requests
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

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

    // Get requests from AzuraCast
    const azuracastService = createAzuraCastService();
    const requests = await azuracastService.getRequests(
      streamingConfig.azuracastStationId
    );

    // Format requests
    const formattedRequests = requests.map((req) => ({
      id: req.request_id,
      song: {
        title: req.song?.title || req.track?.title,
        artist: req.song?.artist || req.track?.artist,
        album: req.song?.album || req.track?.album,
        art: req.song?.art || req.track?.art,
      },
      requestedAt: req.timestamp,
      ipAddress: maskIpAddress(req.ip),
    }));

    return NextResponse.json({ data: formattedRequests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/requests - Submit a song request (public endpoint)
export async function POST(request: NextRequest) {
  try {
    // This can be a public endpoint for listeners
    const body = await request.json();
    const { stationId, ...requestData } = body;

    // Validate request data
    const validatedData = listenerRequestSchema.parse(requestData);

    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID is required" },
        { status: 400 }
      );
    }

    // Find streaming config by public station ID or organization slug
    const streamingConfig = await prisma.streamingConfig.findFirst({
      where: {
        OR: [
          { id: stationId },
          { azuracastStationId: parseInt(stationId) || 0 },
          { organization: { slug: stationId } },
        ],
        isEnabled: true,
        status: "ACTIVE",
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Station not found" },
        { status: 404 }
      );
    }

    if (!streamingConfig.azuracastStationId) {
      return NextResponse.json(
        { error: "Station not accepting requests" },
        { status: 400 }
      );
    }

    // Search for the song in AzuraCast
    const azuracastService = createAzuraCastService();
    const searchResults = await azuracastService.searchMedia(
      streamingConfig.azuracastStationId,
      `${validatedData.songTitle} ${validatedData.artistName || ""}`
    );

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: "Song not found in station library" },
        { status: 404 }
      );
    }

    // Submit request for the first matching song
    const song = searchResults[0];
    const result = await azuracastService.submitRequest(
      streamingConfig.azuracastStationId,
      song.unique_id || song.id.toString()
    );

    return NextResponse.json({
      data: {
        success: true,
        message: "Request submitted successfully",
        song: {
          title: song.title,
          artist: song.artist,
        },
        result,
      },
    });
  } catch (error) {
    console.error("Error submitting request:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/requests - Clear or delete a request
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
    const requestId = searchParams.get("requestId");

    const azuracastService = createAzuraCastService();

    if (requestId) {
      // Delete specific request
      await azuracastService.deleteRequest(
        streamingConfig.azuracastStationId,
        requestId
      );
      return NextResponse.json({
        data: { success: true, message: "Request deleted" },
      });
    } else {
      // Clear all requests
      await azuracastService.clearRequests(streamingConfig.azuracastStationId);
      return NextResponse.json({
        data: { success: true, message: "All requests cleared" },
      });
    }
  } catch (error) {
    console.error("Error managing requests:", error);
    return NextResponse.json(
      { error: "Failed to manage requests" },
      { status: 500 }
    );
  }
}

// Helper to mask IP address for privacy
function maskIpAddress(ip: string | null | undefined): string | null {
  if (!ip) return null;

  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.*.*`;
  }

  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts[0]}:${parts[1]}:****`;
  }

  return "***";
}
