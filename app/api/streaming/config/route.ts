import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import {
  streamingConfigCreateSchema,
  streamingConfigUpdateSchema,
} from "@/lib/validations/streaming.validation";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/config - Get organization's streaming configuration
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

    // Check if streaming is enabled for this organization's plan
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: {
          include: { plan: true },
        },
        streamingConfig: {
          include: {
            mountPoints: true,
            djAccounts: {
              select: {
                id: true,
                azuracastStreamerId: true,
                displayName: true,
                username: true,
                isActive: true,
                lastConnectedAt: true,
                userId: true,
                user: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            playlists: {
              select: {
                id: true,
                azuracastPlaylistId: true,
                name: true,
                type: true,
                isEnabled: true,
                _count: { select: { songs: true } },
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if streaming is enabled (via plan OR feature flag)
    let enabledFeatures: string[] = [];
    try {
      enabledFeatures = organization.enabledFeatures ? JSON.parse(organization.enabledFeatures) : [];
    } catch {
      enabledFeatures = [];
    }

    const hasStreamingFeature = enabledFeatures.includes('streaming');
    const hasPlanStreaming = organization.subscription?.plan?.streamingEnabled;

    if (!hasStreamingFeature && !hasPlanStreaming) {
      return NextResponse.json(
        { error: "Streaming is not available on your current plan. Please contact support to enable streaming." },
        { status: 403 }
      );
    }

    // Build plan limits with defaults
    const planLimits = {
      maxListeners: organization.subscription?.plan?.maxStreamListeners ?? 100,
      storageGB: organization.subscription?.plan?.streamStorageGB ?? 5,
      maxBitrate: organization.subscription?.plan?.maxStreamBitrate ?? 128,
      maxPlaylists: organization.subscription?.plan?.maxStreamPlaylists ?? 10,
      analyticsRetentionDays: organization.subscription?.plan?.streamAnalyticsRetentionDays ?? 30,
      customBranding: organization.subscription?.plan?.customStreamBranding ?? false,
    };

    // If no streaming config exists, return null with plan limits
    if (!organization.streamingConfig) {
      return NextResponse.json({
        data: null,
        planLimits,
      });
    }

    // Build Web DJ URL and fetch current stream URL if AzuraCast is configured
    let webDjUrl: string | null = null;
    let stationShortcode: string | null = null;
    let currentStreamUrl: string | null = organization.streamingConfig.streamUrl;
    const azuracastUrl = process.env.AZURACAST_URL;

    if (azuracastUrl && organization.streamingConfig.azuracastStationId) {
      try {
        // Fetch actual station data from AzuraCast to get the correct shortcode and stream URL
        const azuracastService = createAzuraCastService();
        const station = await azuracastService.getStation(organization.streamingConfig.azuracastStationId);
        stationShortcode = station.shortcode;
        webDjUrl = `${azuracastUrl}/public/${stationShortcode}/dj`;

        // Update stream URL from AzuraCast (in case it changed)
        if (station.listen_url) {
          currentStreamUrl = station.listen_url;

          // Update in database if it changed
          if (currentStreamUrl !== organization.streamingConfig.streamUrl) {
            await prisma.streamingConfig.update({
              where: { id: organization.streamingConfig.id },
              data: { streamUrl: currentStreamUrl },
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch station data from AzuraCast:", error);
        // Fallback to guessing the shortcode
        const fallbackShortcode = organization.slug || organization.name.toLowerCase().replace(/\s+/g, '-');
        webDjUrl = `${azuracastUrl}/public/${fallbackShortcode}/dj`;
      }
    }

    return NextResponse.json({
      data: {
        ...organization.streamingConfig,
        streamUrl: currentStreamUrl, // Use the fresh stream URL
        webDjUrl,
        stationShortcode,
        azuracastUrl: azuracastUrl || null,
        organizationSlug: organization.slug,
      },
      planLimits,
    });
  } catch (error) {
    console.error("Error fetching streaming config:", error);
    return NextResponse.json(
      { error: "Failed to fetch streaming configuration" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/config - Create streaming configuration (setup station)
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

    // Check if streaming is enabled for this organization's plan
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: { include: { plan: true } },
        streamingConfig: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if streaming is enabled (via plan OR feature flag)
    let enabledFeatures: string[] = [];
    try {
      enabledFeatures = organization.enabledFeatures ? JSON.parse(organization.enabledFeatures) : [];
    } catch {
      enabledFeatures = [];
    }

    const hasStreamingFeature = enabledFeatures.includes('streaming');
    const hasPlanStreaming = organization.subscription?.plan?.streamingEnabled;

    if (!hasStreamingFeature && !hasPlanStreaming) {
      return NextResponse.json(
        { error: "Streaming is not available on your current plan. Please contact support to enable streaming." },
        { status: 403 }
      );
    }

    // Check if streaming config already exists
    if (organization.streamingConfig) {
      return NextResponse.json(
        { error: "Streaming is already configured for this organization" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = streamingConfigCreateSchema.parse(body);

    // Create station in AzuraCast
    const azuracastService = createAzuraCastService();

    let azuracastStationId: number | null = null;
    let streamUrl: string | null = null;

    try {
      const stationData = await azuracastService.createStation({
        name: validatedData.stationName,
        short_name: organization.slug || organization.name.toLowerCase().replace(/\s+/g, "-"),
        description: validatedData.stationDescription,
        genre: validatedData.genre,
        timezone: validatedData.timezone,
        enable_requests: true,
        enable_on_demand: false,
        enable_hls: false,
      });

      azuracastStationId = stationData.id;
      streamUrl = stationData.listen_url || null;
    } catch (azuraError) {
      console.error("AzuraCast station creation failed:", azuraError);
      // Continue without AzuraCast - can be linked later
    }

    // Create streaming config in database
    const streamingConfig = await prisma.streamingConfig.create({
      data: {
        organizationId,
        azuracastStationId,
        streamName: validatedData.stationName,
        streamDescription: validatedData.stationDescription,
        streamUrl,
        streamGenre: validatedData.genre,
        isEnabled: true,
        status: "ACTIVE",
      },
      include: {
        mountPoints: true,
        djAccounts: true,
        playlists: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CREATE",
        resource: "streaming_config",
        resourceId: streamingConfig.id,
        description: `Created streaming configuration: ${validatedData.stationName}`,
      },
    });

    return NextResponse.json({ data: streamingConfig }, { status: 201 });
  } catch (error) {
    console.error("Error creating streaming config:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create streaming configuration" },
      { status: 500 }
    );
  }
}

// PATCH /api/streaming/config - Update streaming configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get existing config
    const existingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: "Streaming configuration not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = streamingConfigUpdateSchema.parse(body);

    // Update in AzuraCast if connected
    if (existingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        await azuracastService.updateStation(existingConfig.azuracastStationId, {
          name: validatedData.stationName,
          description: validatedData.stationDescription,
          genre: validatedData.genre,
          timezone: validatedData.timezone,
        });
      } catch (azuraError) {
        console.error("AzuraCast update failed:", azuraError);
        // Continue with local update
      }
    }

    // Update in database
    const updatedConfig = await prisma.streamingConfig.update({
      where: { id: existingConfig.id },
      data: {
        streamName: validatedData.stationName,
        streamDescription: validatedData.stationDescription,
        streamGenre: validatedData.genre,
      },
      include: {
        mountPoints: true,
        djAccounts: true,
        playlists: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "UPDATE",
        resource: "streaming_config",
        resourceId: updatedConfig.id,
        description: `Updated streaming configuration: ${validatedData.stationName || 'settings'}`,
      },
    });

    return NextResponse.json({ data: updatedConfig });
  } catch (error) {
    console.error("Error updating streaming config:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update streaming configuration" },
      { status: 500 }
    );
  }
}
