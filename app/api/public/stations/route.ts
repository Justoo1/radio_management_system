import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/stations - Get all public radio stations
export async function GET() {
  try {
    // Get all organizations with ACTIVE status
    const organizations = await prisma.organization.findMany({
      where: {
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
      orderBy: {
        name: "asc",
      },
    });

    // Map organizations to public format with feature flags
    const publicStations = organizations.map((org) => {
      // Parse enabled features
      let enabledFeatures: string[] = [];
      try {
        enabledFeatures = org.enabledFeatures
          ? JSON.parse(org.enabledFeatures as string)
          : [];
      } catch {
        enabledFeatures = [];
      }

      // Check if streaming is enabled
      const hasStreaming =
        enabledFeatures.includes("streaming") &&
        org.streamingConfig?.isEnabled;

      // Check if airtime is enabled
      const hasAirtime = enabledFeatures.includes("airtime");

      // Determine station type
      const isTraditionalOnly = !hasStreaming && !hasAirtime;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.streamingConfig?.streamName ?? null,
        logo: org.logo,
        website: org.website,
        phone: org.phone,
        email: org.email,
        address: org.address,
        city: org.city,
        state: org.region,
        country: org.country,
        planName: org.subscription?.plan?.name,
        features: {
          streaming: hasStreaming,
          airtime: hasAirtime,
          traditionalFM: true, // All stations have traditional FM
        },
        streamingConfig: hasStreaming
          ? {
              streamName: org.streamingConfig?.streamName,
              streamGenre: org.streamingConfig?.streamGenre,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: publicStations,
      total: publicStations.length,
    });
  } catch (error) {
    console.error("Error fetching public stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch radio stations" },
      { status: 500 }
    );
  }
}
