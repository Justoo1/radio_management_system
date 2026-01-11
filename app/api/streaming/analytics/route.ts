import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { analyticsQuerySchema } from "@/lib/validations/streaming.validation";

// GET /api/streaming/analytics - Get streaming analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check permission
    if (!hasPermission(session.user, "streaming", "read")) {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = analyticsQuerySchema.parse({
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      interval: searchParams.get("interval") || "day",
      mountPointId: searchParams.get("mountPointId") || undefined,
    });

    // Default date range: last 30 days
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const startDate = params.startDate
      ? new Date(params.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const whereClause: {
      streamingConfigId: string;
      timestamp: { gte: Date; lte: Date };
    } = {
      streamingConfigId: streamingConfig.id,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Get analytics data from database
    const analytics = await prisma.streamAnalytics.findMany({
      where: whereClause,
      orderBy: { timestamp: "asc" },
    });

    // Get listener sessions
    const listenerSessions = await prisma.streamListenerSession.findMany({
      where: {
        streamingConfigId: streamingConfig.id,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get now playing history
    const nowPlayingHistory = await prisma.streamNowPlayingHistory.findMany({
      where: {
        streamingConfigId: streamingConfig.id,
        playedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { playedAt: "desc" },
      take: 100,
    });

    // Calculate summary statistics
    const totalListeners = listenerSessions.length;
    const uniqueListeners = new Set(
      listenerSessions.map((s) => s.ipAddress || s.userAgent)
    ).size;

    const totalDuration = listenerSessions.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0
    );
    const avgDuration = totalListeners > 0 ? totalDuration / totalListeners : 0;

    // Peak listeners
    const peakListeners = Math.max(
      ...analytics.map((a) => a.listenersMax),
      0
    );
    const avgListeners =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.listenersAvg, 0) / analytics.length
        : 0;

    // Country breakdown
    const countryBreakdown: Record<string, number> = {};
    listenerSessions.forEach((s) => {
      if (s.country) {
        countryBreakdown[s.country] = (countryBreakdown[s.country] || 0) + 1;
      }
    });

    // Player breakdown
    const clientBreakdown: Record<string, number> = {};
    listenerSessions.forEach((s) => {
      if (s.player) {
        clientBreakdown[s.player] = (clientBreakdown[s.player] || 0) + 1;
      }
    });

    // Group analytics by interval
    const groupedAnalytics = groupByInterval(analytics, params.interval);

    // Fetch real-time data from AzuraCast if available
    let realtimeData = null;
    if (streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        const nowPlaying = await azuracastService.getNowPlaying(
          streamingConfig.azuracastStationId
        );
        realtimeData = {
          currentListeners: nowPlaying.listeners?.current || 0,
          uniqueListeners: nowPlaying.listeners?.unique || 0,
          isLive: nowPlaying.live?.is_live || false,
          streamerName: nowPlaying.live?.streamer_name,
        };
      } catch {
        // Ignore AzuraCast errors
      }
    }

    return NextResponse.json({
      data: {
        summary: {
          totalListeners,
          uniqueListeners,
          peakListeners,
          avgListeners: Math.round(avgListeners * 100) / 100,
          totalDuration,
          avgDuration: Math.round(avgDuration),
          totalSongsPlayed: nowPlayingHistory.length,
        },
        realtime: realtimeData,
        timeline: groupedAnalytics,
        countryBreakdown,
        clientBreakdown,
        recentTracks: nowPlayingHistory.slice(0, 20).map((h) => ({
          title: h.title,
          artist: h.artist,
          playedAt: h.playedAt,
          listeners: h.listenersAtPlay,
          isLive: h.isLive,
          djName: h.djName,
        })),
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching streaming analytics:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch streaming analytics" },
      { status: 500 }
    );
  }
}

// Helper to group analytics by interval
function groupByInterval(
  analytics: Array<{
    timestamp: Date;
    listenersAvg: number;
    listenersMax: number;
    totalListeningMinutes: number;
  }>,
  interval: string
): Array<{
  date: string;
  avgListeners: number;
  peakListeners: number;
  totalMinutes: number;
}> {
  const groups: Record<
    string,
    {
      avgListeners: number[];
      peakListeners: number;
      totalMinutes: number;
    }
  > = {};

  analytics.forEach((a) => {
    let key: string;
    const date = new Date(a.timestamp);

    switch (interval) {
      case "hour":
        key = date.toISOString().slice(0, 13) + ":00:00";
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().slice(0, 10);
        break;
      case "month":
        key = date.toISOString().slice(0, 7);
        break;
      default: // day
        key = date.toISOString().slice(0, 10);
    }

    if (!groups[key]) {
      groups[key] = { avgListeners: [], peakListeners: 0, totalMinutes: 0 };
    }

    groups[key].avgListeners.push(a.listenersAvg);
    groups[key].peakListeners = Math.max(groups[key].peakListeners, a.listenersMax);
    groups[key].totalMinutes += a.totalListeningMinutes;
  });

  return Object.entries(groups)
    .map(([date, data]) => ({
      date,
      avgListeners:
        Math.round(
          (data.avgListeners.reduce((a, b) => a + b, 0) / data.avgListeners.length) * 100
        ) / 100,
      peakListeners: data.peakListeners,
      totalMinutes: data.totalMinutes,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
