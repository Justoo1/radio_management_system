import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/streaming/media/[id] - Get single media file details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig?.azuracastStationId) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    // Get media file from AzuraCast
    const azuracastService = createAzuraCastService();
    const mediaFile = await azuracastService.getMediaFile(
      streamingConfig.azuracastStationId,
      id
    );

    return NextResponse.json({ data: mediaFile });
  } catch (error) {
    console.error("Error fetching media file:", error);
    return NextResponse.json(
      { error: "Failed to fetch media file" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/media/[id] - Delete media file from AzuraCast
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "delete")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig?.azuracastStationId) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    // Get file info before deletion to update storage
    const azuracastService = createAzuraCastService();
    let fileSize = 0;
    try {
      const mediaFile = await azuracastService.getMediaFile(
        streamingConfig.azuracastStationId,
        id
      );
      fileSize = mediaFile.size || 0; // Size in bytes from AzuraCast
    } catch (error) {
      console.warn("Could not get file size before deletion:", error);
    }

    // Delete from AzuraCast
    await azuracastService.deleteMedia(
      streamingConfig.azuracastStationId,
      id
    );

    // Update streaming storage usage (decrement)
    if (fileSize > 0) {
      const fileSizeMB = Math.ceil(fileSize / (1024 * 1024));
      await prisma.streamingConfig.update({
        where: { organizationId },
        data: {
          storageUsedMB: {
            decrement: fileSizeMB,
          },
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "DELETE",
        resource: "stream_media",
        resourceId: id,
        description: `Deleted media file ID: ${id}`,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting media file:", error);
    return NextResponse.json(
      { error: "Failed to delete media file" },
      { status: 500 }
    );
  }
}
