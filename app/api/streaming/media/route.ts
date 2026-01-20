import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/media - List media files from AzuraCast
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

    if (!streamingConfig?.azuracastStationId) {
      return NextResponse.json(
        { error: "Streaming not configured or no AzuraCast station linked" },
        { status: 404 }
      );
    }

    // Get media files from AzuraCast
    const azuracastService = createAzuraCastService();
    const mediaFiles = await azuracastService.getMedia(streamingConfig.azuracastStationId);

    return NextResponse.json({ data: mediaFiles });
  } catch (error) {
    console.error("Error fetching media files:", error);
    return NextResponse.json(
      { error: "Failed to fetch media files" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/media - Upload media file to AzuraCast
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

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig?.azuracastStationId) {
      return NextResponse.json(
        { error: "Streaming not configured or no AzuraCast station linked" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const path = formData.get("path") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/x-m4a", "audio/x-wav", "audio/wave"];
    const allowedExtensions = /\.(mp3|wav|ogg|flac|aac|m4a)$/i;

    if (!allowedTypes.includes(file.type) && !file.name.match(allowedExtensions)) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are allowed: MP3, WAV, OGG, FLAC, AAC, M4A" },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB` },
        { status: 400 }
      );
    }

    // Validate file size (minimum 1KB to avoid empty files)
    if (file.size < 1024) {
      return NextResponse.json(
        { error: "File is too small or empty" },
        { status: 400 }
      );
    }

    // Check organization storage limit before upload
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { maxStorageGB: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Calculate current storage usage (MediaFile + Streaming storage)
    const [mediaStorage, streamConfig] = await Promise.all([
      prisma.mediaFile.aggregate({
        where: { organizationId },
        _sum: { size: true },
      }),
      prisma.streamingConfig.findUnique({
        where: { organizationId },
        select: { storageUsedMB: true, storageQuotaMB: true },
      }),
    ]);

    const mediaStorageBytes = mediaStorage._sum?.size || 0;
    const streamingStorageBytes = (streamConfig?.storageUsedMB || 0) * 1024 * 1024; // MB to bytes
    const totalUsedBytes = mediaStorageBytes + streamingStorageBytes + file.size;
    const maxStorageBytes = organization.maxStorageGB * 1024 * 1024 * 1024; // GB to bytes

    if (totalUsedBytes > maxStorageBytes) {
      const usedGB = ((mediaStorageBytes + streamingStorageBytes) / (1024 * 1024 * 1024)).toFixed(2);
      const fileMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: "Storage limit exceeded",
          message: `Uploading this file would exceed your storage limit. Current usage: ${usedGB}GB / ${organization.maxStorageGB}GB. File size: ${fileMB}MB. Please upgrade your plan for more storage.`,
        },
        { status: 400 }
      );
    }

    // Upload to AzuraCast
    const azuracastService = createAzuraCastService();
    const uploadedMedia = await azuracastService.uploadMedia(
      streamingConfig.azuracastStationId,
      file,
      file.name,
      path || undefined
    );

    // Update streaming storage usage
    const fileSizeMB = file.size / (1024 * 1024);
    await prisma.streamingConfig.update({
      where: { organizationId },
      data: {
        storageUsedMB: {
          increment: Math.ceil(fileSizeMB), // Round up to nearest MB
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CREATE",
        resource: "stream_media",
        resourceId: String(uploadedMedia.id),
        description: `Uploaded media file: ${file.name}`,
      },
    });

    return NextResponse.json({ data: uploadedMedia }, { status: 201 });
  } catch (error) {
    console.error("Error uploading media file:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload media file" },
      { status: 500 }
    );
  }
}
