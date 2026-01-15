import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/public/stations/[slug] - Get single station details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findUnique({
      where: {
        slug,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        website: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        region: true,
        country: true,
        enabledFeatures: true,
        streamingConfig: {
          select: {
            id: true,
            isEnabled: true,
            streamUrl: true,
            streamName: true,
            streamDescription: true,
            streamGenre: true,
            azuracastStationId: true,
          },
        },
        subscription: {
          select: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Station not found" },
        { status: 404 }
      );
    }

    // Parse enabled features
    let enabledFeatures: string[] = [];
    try {
      enabledFeatures = organization.enabledFeatures
        ? JSON.parse(organization.enabledFeatures as string)
        : [];
    } catch {
      enabledFeatures = [];
    }

    // Check if streaming is enabled
    const hasStreaming =
      enabledFeatures.includes("streaming") &&
      organization.streamingConfig?.isEnabled;

    // Check if airtime is enabled
    const hasAirtime = enabledFeatures.includes("airtime");

    // If streaming is enabled, fetch fresh stream URL from AzuraCast
    let streamUrl = organization.streamingConfig?.streamUrl;

    if (
      hasStreaming &&
      organization.streamingConfig?.azuracastStationId &&
      process.env.AZURACAST_URL
    ) {
      try {
        const { createAzuraCastService } = await import(
          "@/lib/services/azuracast.service"
        );
        const azuracastService = createAzuraCastService();
        const station = await azuracastService.getStation(
          organization.streamingConfig.azuracastStationId
        );

        if (station.listen_url) {
          streamUrl = station.listen_url;

          // Update database if URL changed
          if (streamUrl !== organization.streamingConfig.streamUrl) {
            await prisma.streamingConfig.update({
              where: { id: organization.streamingConfig.id },
              data: { streamUrl },
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch stream URL from AzuraCast:", error);
        // Continue with database URL
      }
    }

    const publicStation = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      description: organization.streamingConfig?.streamDescription ?? null,
      logo: organization.logo,
      website: organization.website,
      phone: organization.phone,
      email: organization.email,
      address: organization.address,
      city: organization.city,
      state: organization.region,
      country: organization.country,
      planName: organization.subscription?.plan?.name,
      features: {
        streaming: !!hasStreaming,
        airtime: !!hasAirtime,
        traditionalFM: true,
      },
      streamingConfig: hasStreaming
        ? {
            streamName: organization.streamingConfig?.streamName,
            streamDescription: organization.streamingConfig?.streamDescription,
            streamGenre: organization.streamingConfig?.streamGenre,
            streamUrl,
          }
        : null,
    };

    return NextResponse.json({ data: publicStation });
  } catch (error) {
    console.error("Error fetching station:", error);
    return NextResponse.json(
      { error: "Failed to fetch station details" },
      { status: 500 }
    );
  }
}
