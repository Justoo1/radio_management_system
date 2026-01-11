import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { mountPointCreateSchema } from "@/lib/validations/streaming.validation";

// GET /api/streaming/mount-points - List mount points
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get streaming config with mount points
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      include: {
        mountPoints: {
          orderBy: { isDefault: "desc" },
        },
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    // If connected to AzuraCast, fetch live mount point data
    let liveMountPoints: Array<{
      id: number;
      name: string;
      url?: string;
      listeners?: { current: number; unique: number; total: number };
      is_default?: boolean;
    }> = [];

    if (streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        liveMountPoints = await azuracastService.getMountPoints(
          streamingConfig.azuracastStationId
        );
      } catch (azuraError) {
        console.error("AzuraCast mount points fetch failed:", azuraError);
      }
    }

    // Merge live data with database records
    const mountPointsWithLiveData = streamingConfig.mountPoints.map((mp) => {
      const liveData = liveMountPoints.find(
        (lmp) => lmp.name === mp.name || lmp.url?.includes(mp.mountPoint)
      );
      return {
        ...mp,
        liveUrl: liveData?.url,
        currentListeners: liveData?.listeners?.current || 0,
        uniqueListeners: liveData?.listeners?.unique || 0,
      };
    });

    return NextResponse.json({ data: mountPointsWithLiveData });
  } catch (error) {
    console.error("Error fetching mount points:", error);
    return NextResponse.json(
      { error: "Failed to fetch mount points" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/mount-points - Create mount point
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

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = mountPointCreateSchema.parse(body);

    // Check for duplicate mount path
    const existingMount = await prisma.streamMountPoint.findFirst({
      where: {
        streamingConfigId: streamingConfig.id,
        mountPoint: validatedData.mountPath,
      },
    });

    if (existingMount) {
      return NextResponse.json(
        { error: "Mount path already exists" },
        { status: 400 }
      );
    }

    let streamUrl: string | null = null;

    // Create in AzuraCast if connected
    if (streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        const mount = await azuracastService.createMountPoint(
          streamingConfig.azuracastStationId,
          {
            name: validatedData.name,
            display_name: validatedData.name,
            url: validatedData.mountPath,
            is_default: validatedData.isDefault,
            enable_autodj: true,
            autodj_format: validatedData.format,
            autodj_bitrate: validatedData.bitrate,
          }
        );
        streamUrl = mount.url || mount.listen_url || null;
      } catch (azuraError) {
        console.error("AzuraCast mount point creation failed:", azuraError);
      }
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.streamMountPoint.updateMany({
        where: {
          streamingConfigId: streamingConfig.id,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Map format to Prisma enum
    const formatMap: Record<string, "MP3" | "AAC" | "OGG" | "OPUS" | "FLAC"> = {
      mp3: "MP3",
      aac: "AAC",
      ogg: "OGG",
      opus: "OPUS",
      flac: "FLAC",
    };

    // Create in database
    const mountPoint = await prisma.streamMountPoint.create({
      data: {
        streamingConfigId: streamingConfig.id,
        name: validatedData.name,
        mountPoint: validatedData.mountPath,
        url: streamUrl || `${streamingConfig.streamUrl || ''}${validatedData.mountPath}`,
        format: formatMap[validatedData.format] || "MP3",
        bitrate: validatedData.bitrate,
        isDefault: validatedData.isDefault,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CREATE",
        resource: "stream_mount_point",
        resourceId: mountPoint.id,
        description: `Created mount point: ${validatedData.name} (${validatedData.mountPath})`,
      },
    });

    return NextResponse.json({ data: mountPoint }, { status: 201 });
  } catch (error) {
    console.error("Error creating mount point:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create mount point" },
      { status: 500 }
    );
  }
}
