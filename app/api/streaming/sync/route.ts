/**
 * Streaming Sync API
 * Syncs playlists and mount points from AzuraCast to local database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { Feature, checkFeatureAccess } from "@/lib/features";

// POST /api/streaming/sync - Sync data from AzuraCast
export async function POST(request: NextRequest) {
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
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      include: {
        playlists: true,
        mountPoints: true,
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    if (!streamingConfig.azuracastStationId) {
      return NextResponse.json(
        { error: "No AzuraCast station linked" },
        { status: 400 }
      );
    }

    // Check if AzuraCast is configured
    if (!process.env.AZURACAST_URL || !process.env.AZURACAST_API_KEY) {
      return NextResponse.json(
        { error: "AzuraCast is not configured on this server" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const syncType = body.type || "all"; // "all", "playlists", "mount_points"

    const azuracastService = createAzuraCastService();
    const stationId = streamingConfig.azuracastStationId;

    const results = {
      playlists: { synced: 0, created: 0, updated: 0 },
      mountPoints: { synced: 0, created: 0, updated: 0 },
    };

    // Sync playlists
    if (syncType === "all" || syncType === "playlists") {
      try {
        const azPlaylists = await azuracastService.getPlaylists(stationId);

        for (const azPlaylist of azPlaylists) {
          // Check if playlist already exists in database
          const existingPlaylist = await prisma.streamPlaylist.findFirst({
            where: {
              streamingConfigId: streamingConfig.id,
              azuracastPlaylistId: azPlaylist.id,
            },
          });

          // Map AzuraCast type to Prisma enum
          const typeMap: Record<string, "DEFAULT" | "SCHEDULED" | "ONCE_PER_HOUR" | "ONCE_PER_DAY" | "JINGLES" | "REQUESTS"> = {
            default: "DEFAULT",
            once_per_hour: "ONCE_PER_HOUR",
            once_per_x_songs: "ONCE_PER_HOUR",
            once_per_x_minutes: "ONCE_PER_HOUR",
            advanced: "DEFAULT",
          };

          const playlistType = typeMap[azPlaylist.type] || "DEFAULT";

          if (existingPlaylist) {
            // Update existing playlist
            await prisma.streamPlaylist.update({
              where: { id: existingPlaylist.id },
              data: {
                name: azPlaylist.name,
                type: playlistType,
                weight: azPlaylist.weight,
                isEnabled: azPlaylist.is_enabled,
              },
            });
            results.playlists.updated++;
          } else {
            // Create new playlist
            await prisma.streamPlaylist.create({
              data: {
                streamingConfigId: streamingConfig.id,
                azuracastPlaylistId: azPlaylist.id,
                name: azPlaylist.name,
                type: playlistType,
                weight: azPlaylist.weight,
                isEnabled: azPlaylist.is_enabled,
              },
            });
            results.playlists.created++;
          }
          results.playlists.synced++;
        }
      } catch (error) {
        console.error("Error syncing playlists:", error);
      }
    }

    // Sync mount points
    if (syncType === "all" || syncType === "mount_points") {
      try {
        const azMountPoints = await azuracastService.getMountPoints(stationId);

        for (const azMount of azMountPoints) {
          // Check if mount point already exists in database
          const existingMount = await prisma.streamMountPoint.findFirst({
            where: {
              streamingConfigId: streamingConfig.id,
              OR: [
                { azuracastMountId: azMount.id },
                { name: azMount.name },
              ],
            },
          });

          // Determine format from URL or default
          let format: "MP3" | "AAC" | "OGG" | "OPUS" | "FLAC" = "MP3";
          if (azMount.url) {
            if (azMount.url.includes(".ogg")) format = "OGG";
            else if (azMount.url.includes(".opus")) format = "OPUS";
            else if (azMount.url.includes(".aac")) format = "AAC";
            else if (azMount.url.includes(".flac")) format = "FLAC";
          }

          if (existingMount) {
            // Update existing mount point
            await prisma.streamMountPoint.update({
              where: { id: existingMount.id },
              data: {
                name: azMount.name,
                url: azMount.url || existingMount.url,
                isDefault: azMount.is_default,
                azuracastMountId: azMount.id,
              },
            });
            results.mountPoints.updated++;
          } else {
            // Create new mount point
            await prisma.streamMountPoint.create({
              data: {
                streamingConfigId: streamingConfig.id,
                azuracastMountId: azMount.id,
                name: azMount.name,
                mountPoint: azMount.url?.split("/").pop() || `/radio/${azMount.id}`,
                url: azMount.url || "",
                format,
                bitrate: 128,
                isDefault: azMount.is_default,
              },
            });
            results.mountPoints.created++;
          }
          results.mountPoints.synced++;
        }
      } catch (error) {
        console.error("Error syncing mount points:", error);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: session.user.id,
        action: "UPDATE",
        resource: "streaming_sync",
        resourceId: streamingConfig.id,
        description: `Synced ${results.playlists.synced} playlists and ${results.mountPoints.synced} mount points from AzuraCast`,
      },
    });

    return NextResponse.json({
      data: results,
      message: `Successfully synced ${results.playlists.synced} playlists and ${results.mountPoints.synced} mount points`,
    });
  } catch (error) {
    console.error("Error syncing from AzuraCast:", error);
    return NextResponse.json(
      { error: "Failed to sync from AzuraCast" },
      { status: 500 }
    );
  }
}
