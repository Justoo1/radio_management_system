import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/status - Get current streaming status and now playing
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

    // If not connected to AzuraCast, return local status
    if (!streamingConfig.azuracastStationId) {
      return NextResponse.json({
        data: {
          isOnline: false,
          streamUrl: streamingConfig.streamUrl,
          stationName: streamingConfig.streamName,
          nowPlaying: null,
          listeners: { current: 0, unique: 0, total: 0 },
          live: { isLive: false, streamerName: null },
          mountPoints: streamingConfig.mountPoints,
        },
      });
    }

    // Get status from AzuraCast
    const azuracastService = createAzuraCastService();

    try {
      const nowPlaying = await azuracastService.getNowPlaying(
        streamingConfig.azuracastStationId
      );

      // Update local now playing history
      if (nowPlaying.now_playing?.song) {
        await prisma.streamNowPlayingHistory.create({
          data: {
            streamingConfigId: streamingConfig.id,
            title: nowPlaying.now_playing.song.title,
            artist: nowPlaying.now_playing.song.artist,
            album: nowPlaying.now_playing.song.album,
            artworkUrl: nowPlaying.now_playing.song.art,
            playedAt: new Date(),
            listenersAtPlay: nowPlaying.listeners?.current || 0,
            isLive: nowPlaying.live?.is_live || false,
            djName: nowPlaying.live?.streamer_name,
          },
        }).catch(() => {
          // Ignore duplicate entries
        });
      }

      return NextResponse.json({
        data: {
          isOnline: nowPlaying.is_online ?? true,
          streamUrl: streamingConfig.streamUrl || nowPlaying.station?.listen_url,
          stationName: streamingConfig.streamName,
          nowPlaying: nowPlaying.now_playing
            ? {
                song: {
                  title: nowPlaying.now_playing.song.title,
                  artist: nowPlaying.now_playing.song.artist,
                  album: nowPlaying.now_playing.song.album,
                  art: nowPlaying.now_playing.song.art,
                },
                elapsed: nowPlaying.now_playing.elapsed,
                duration: nowPlaying.now_playing.duration,
                remaining: nowPlaying.now_playing.remaining,
              }
            : null,
          listeners: {
            current: nowPlaying.listeners?.current || 0,
            unique: nowPlaying.listeners?.unique || 0,
            total: nowPlaying.listeners?.total || 0,
          },
          live: {
            isLive: nowPlaying.live?.is_live || false,
            streamerName: nowPlaying.live?.streamer_name || null,
          },
          playing_next: nowPlaying.playing_next
            ? {
                title: nowPlaying.playing_next.song?.title,
                artist: nowPlaying.playing_next.song?.artist,
              }
            : null,
          mountPoints: streamingConfig.mountPoints,
        },
      });
    } catch (azuraError) {
      console.error("AzuraCast status fetch failed:", azuraError);

      // Return cached/local status
      return NextResponse.json({
        data: {
          isOnline: false,
          streamUrl: streamingConfig.streamUrl,
          stationName: streamingConfig.streamName,
          nowPlaying: null,
          listeners: { current: 0, unique: 0, total: 0 },
          live: { isLive: false, streamerName: null },
          mountPoints: streamingConfig.mountPoints,
          error: "Unable to fetch live status from streaming server",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching streaming status:", error);
    return NextResponse.json(
      { error: "Failed to fetch streaming status" },
      { status: 500 }
    );
  }
}
