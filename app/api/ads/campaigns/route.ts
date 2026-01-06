import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdCampaignSchema,
  adCampaignFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/campaigns - List ad campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Check if feature is enabled
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { enabledFeatures: true },
    });

    if (!hasFeature(organization, "advertisements")) {
      return NextResponse.json(
        { error: "Advertisements feature not enabled" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterInput = {
      clientId: searchParams.get("clientId") || undefined,
      status: searchParams.get("status") || undefined,
      fulfillmentStatus: searchParams.get("fulfillmentStatus") || undefined,
      scheduleType: searchParams.get("scheduleType") || undefined,
      packageId: searchParams.get("packageId") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = adCampaignFilterSchema.parse(filterInput);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (validated.clientId) {
      where.clientId = validated.clientId;
    }

    if (validated.status) {
      where.status = validated.status;
    }

    if (validated.fulfillmentStatus) {
      where.fulfillmentStatus = validated.fulfillmentStatus;
    }

    if (validated.scheduleType) {
      where.scheduleType = validated.scheduleType;
    }

    if (validated.packageId) {
      where.packageId = validated.packageId;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    if (validated.startDate) {
      where.startDate = { gte: new Date(validated.startDate) };
    }

    if (validated.endDate) {
      where.endDate = { lte: new Date(validated.endDate) };
    }

    // Fetch campaigns
    const [campaigns, total] = await Promise.all([
      prisma.adCampaign.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
              packageType: true,
              basePrice: true,
            },
          },
          targetProgram: {
            select: {
              id: true,
              name: true,
            },
          },
          targetDaypart: {
            select: {
              id: true,
              name: true,
            },
          },
          advertisements: {
            select: {
              id: true,
              title: true,
              duration: true,
              totalPlays: true,
              status: true,
            },
          },
          _count: {
            select: {
              advertisements: true,
            },
          },
        },
      }),
      prisma.adCampaign.count({ where }),
    ]);

    // Calculate aggregate data for each campaign
    const campaignsWithStats = campaigns.map((campaign) => {
      // Calculate total plays across all advertisements
      const totalPlays = campaign.advertisements.reduce(
        (sum, ad) => sum + ad.totalPlays,
        0
      );

      // Calculate fulfillment rate
      const fulfillmentRate = campaign.targetPlays
        ? Math.round((campaign.completedPlays / campaign.targetPlays) * 100)
        : null;

      return {
        ...campaign,
        totalPlays,
        totalAds: campaign._count.advertisements,
        fulfillmentRate,
      };
    });

    return NextResponse.json({
      data: campaignsWithStats,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching ad campaigns:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch ad campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/ads/campaigns - Create ad campaign
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Check if feature is enabled
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { enabledFeatures: true },
    });

    if (!hasFeature(organization, "advertisements")) {
      return NextResponse.json(
        { error: "Advertisements feature not enabled" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createAdCampaignSchema.parse(body);

    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: validated.clientId,
        organizationId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or does not belong to your organization" },
        { status: 404 }
      );
    }

    // Verify package if provided
    if (validated.packageId) {
      const pkg = await prisma.adPackage.findFirst({
        where: {
          id: validated.packageId,
          organizationId,
        },
      });

      if (!pkg) {
        return NextResponse.json(
          { error: "Package not found" },
          { status: 404 }
        );
      }
    }

    // Verify target program if provided
    if (validated.targetProgramId) {
      const program = await prisma.program.findFirst({
        where: {
          id: validated.targetProgramId,
          organizationId,
        },
      });

      if (!program) {
        return NextResponse.json(
          { error: "Target program not found" },
          { status: 404 }
        );
      }
    }

    // Verify target daypart if provided
    if (validated.targetDaypartId) {
      const daypart = await prisma.adDaypart.findFirst({
        where: {
          id: validated.targetDaypartId,
          organizationId,
        },
      });

      if (!daypart) {
        return NextResponse.json(
          { error: "Target daypart not found" },
          { status: 404 }
        );
      }
    }

    // Create campaign
    const campaign = await prisma.adCampaign.create({
      data: {
        organizationId,
        clientId: validated.clientId,
        name: validated.name,
        description: validated.description,
        budget: validated.budget,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        status: validated.status,
        packageId: validated.packageId,
        scheduleType: validated.scheduleType,
        targetPlays: validated.targetPlays,
        targetProgramId: validated.targetProgramId,
        targetDaypartId: validated.targetDaypartId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            packageType: true,
            basePrice: true,
          },
        },
        targetProgram: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDaypart: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: campaign,
        message: "Ad campaign created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ad campaign:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create ad campaign" },
      { status: 500 }
    );
  }
}
