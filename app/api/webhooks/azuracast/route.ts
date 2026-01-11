import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { azuracastWebhookSchema } from "@/lib/validations/streaming.validation";
import crypto from "crypto";

// POST /api/webhooks/azuracast - Handle AzuraCast webhooks
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.AZURACAST_WEBHOOK_SECRET;
    const signature = request.headers.get("X-AzuraCast-Signature");

    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Parse body after verification
      const data = JSON.parse(body);
      return await handleWebhook(data);
    } else {
      // No signature verification (for development)
      const data = await request.json();
      return await handleWebhook(data);
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleWebhook(data: unknown) {
  // Validate webhook data
  const validatedData = azuracastWebhookSchema.safeParse(data);

  if (!validatedData.success) {
    console.error("Invalid webhook data:", validatedData.error);
    return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 });
  }

  const { type, station, now_playing } = validatedData.data;

  // Find streaming config by AzuraCast station ID
  const streamingConfig = await prisma.streamingConfig.findFirst({
    where: { azuracastStationId: station.id },
  });

  if (!streamingConfig) {
    console.log(`Station ${station.id} not linked to any organization`);
    return NextResponse.json({ received: true });
  }

  // Handle different webhook types
  switch (type) {
    case "song_changed":
      if (now_playing?.song) {
        await prisma.streamNowPlayingHistory.create({
          data: {
            streamingConfigId: streamingConfig.id,
            title: now_playing.song.title,
            artist: now_playing.song.artist,
            album: now_playing.song.album,
            artworkUrl: now_playing.song.art,
            playedAt: new Date(),
            listenersAtPlay: now_playing.listeners?.current || 0,
            isLive: now_playing.live?.is_live || false,
            djName: now_playing.live?.streamer_name,
          },
        });
      }
      break;

    case "listener_gained":
    case "listener_lost":
      // Update analytics
      await updateListenerAnalytics(
        streamingConfig.id,
        now_playing?.listeners?.current || 0
      );
      break;

    case "live_connect":
      if (now_playing?.live?.streamer_name) {
        // Update DJ account last connected
        await prisma.streamDJAccount.updateMany({
          where: {
            streamingConfigId: streamingConfig.id,
            displayName: now_playing.live.streamer_name,
          },
          data: {
            lastConnectedAt: new Date(),
          },
        });

        // Note: ActivityLog requires userId, so webhook-triggered events
        // are tracked via StreamNowPlayingHistory instead
        console.log(`DJ connected: ${now_playing.live.streamer_name}`);
      }
      break;

    case "live_disconnect":
      if (now_playing?.live?.streamer_name) {
        console.log(`DJ disconnected: ${now_playing.live.streamer_name}`);
      }
      break;

    case "station_online":
      await prisma.streamingConfig.update({
        where: { id: streamingConfig.id },
        data: { status: "ACTIVE" },
      });
      console.log(`Station ${station.id} came online`);
      break;

    case "station_offline":
      await prisma.streamingConfig.update({
        where: { id: streamingConfig.id },
        data: { status: "OFFLINE" },
      });
      console.log(`Station ${station.id} went offline`);
      break;
  }

  return NextResponse.json({ received: true, type });
}

async function updateListenerAnalytics(
  streamingConfigId: string,
  currentListeners: number
) {
  const now = new Date();
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  // Try to find existing analytics record for this hour
  const existingAnalytics = await prisma.streamAnalytics.findFirst({
    where: {
      streamingConfigId,
      timestamp: {
        gte: hourStart,
        lt: new Date(hourStart.getTime() + 60 * 60 * 1000),
      },
    },
  });

  if (existingAnalytics) {
    // Update existing record
    await prisma.streamAnalytics.update({
      where: { id: existingAnalytics.id },
      data: {
        listenersMax: Math.max(existingAnalytics.listenersMax, currentListeners),
        listenersAvg:
          (existingAnalytics.listenersAvg + currentListeners) / 2,
      },
    });
  } else {
    // Create new hourly analytics record
    await prisma.streamAnalytics.create({
      data: {
        streamingConfigId,
        timestamp: hourStart,
        listenersAvg: currentListeners,
        listenersMax: currentListeners,
        listenersMin: currentListeners,
        uniqueListeners: currentListeners,
        totalListeningMinutes: 0,
      },
    });
  }
}
