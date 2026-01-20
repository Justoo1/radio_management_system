import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { listenerSessionQuerySchema } from "@/lib/validations/streaming.validation";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/listeners - Get listener information
export async function GET(request: NextRequest) {
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

    // Check permission
    if (!hasPermission(session.user, "streaming", "read")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      include: {
        mountPoints: true,
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = listenerSessionQuerySchema.parse({
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      mountPointId: searchParams.get("mountPointId") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    });

    // Fetch current listeners from AzuraCast
    let currentListeners: Array<{
      ip: string;
      user_agent: string;
      connected_time: number;
      mount_name?: string;
      location?: { country?: string; city?: string; region?: string };
    }> = [];

    if (streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        currentListeners = await azuracastService.getListeners(
          streamingConfig.azuracastStationId
        );
      } catch (azuraError) {
        console.error("AzuraCast listeners fetch failed:", azuraError);
      }
    }

    // Build where clause for historical sessions
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const whereClause: {
      streamingConfigId: string;
      startedAt: { gte: Date; lte: Date };
      mountPoint?: string;
    } = {
      streamingConfigId: streamingConfig.id,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (params.mountPointId) {
      // Find the mount point name from the ID
      const mp = streamingConfig.mountPoints.find(m => m.id === params.mountPointId);
      if (mp) {
        whereClause.mountPoint = mp.mountPoint;
      }
    }

    // Get historical listener sessions
    const [sessions, totalCount] = await Promise.all([
      prisma.streamListenerSession.findMany({
        where: whereClause,
        orderBy: { startedAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.streamListenerSession.count({ where: whereClause }),
    ]);

    // Format current listeners
    const formattedCurrentListeners = currentListeners.map((l) => ({
      ip: maskIpAddress(l.ip),
      userAgent: l.user_agent,
      connectedTime: l.connected_time,
      mountName: l.mount_name,
      country: l.location?.country,
      city: l.location?.city,
      region: l.location?.region,
    }));

    return NextResponse.json({
      data: {
        current: {
          count: currentListeners.length,
          listeners: formattedCurrentListeners,
        },
        historical: {
          sessions: sessions.map((s) => ({
            id: s.id,
            ipAddress: maskIpAddress(s.ipAddress),
            userAgent: s.userAgent,
            player: s.player,
            country: s.country,
            city: s.city,
            region: s.region,
            startedAt: s.startedAt,
            endedAt: s.endedAt,
            durationSeconds: s.durationSeconds,
            mountPoint: s.mountPoint,
          })),
          pagination: {
            page: params.page,
            limit: params.limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / params.limit),
          },
        },
        mountPoints: streamingConfig.mountPoints.map((mp) => ({
          id: mp.id,
          name: mp.name,
          mountPoint: mp.mountPoint,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching listeners:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch listeners" },
      { status: 500 }
    );
  }
}

// Helper to mask IP address for privacy
function maskIpAddress(ip: string | null): string | null {
  if (!ip) return null;

  // IPv4: show first two octets
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.*.*`;
  }

  // IPv6: show first two groups
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts[0]}:${parts[1]}:****`;
  }

  return "***";
}
