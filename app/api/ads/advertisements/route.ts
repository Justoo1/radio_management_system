import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdvertisementSchema,
  advertisementFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/advertisements - List advertisements
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

    const searchParams = request.nextUrl.searchParams;
    const filterInput = {
      campaignId: searchParams.get("campaignId") || undefined,
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = advertisementFilterSchema.parse(filterInput);

    const where: any = {
      campaign: {
        organizationId,
      },
    };

    if (validated.campaignId) {
      where.campaignId = validated.campaignId;
    }

    if (validated.search) {
      where.title = { contains: validated.search, mode: "insensitive" };
    }

    const [advertisements, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              status: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          mediaFile: {
            select: {
              id: true,
              name: true,
              url: true,
              duration: true,
            },
          },
        },
      }),
      prisma.advertisement.count({ where }),
    ]);

    return NextResponse.json({
      data: advertisements,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching advertisements:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 }
    );
  }
}

// POST /api/ads/advertisements - Create advertisement
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
    const validated = createAdvertisementSchema.parse(body);

    // Verify campaign belongs to organization
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: validated.campaignId,
        organizationId,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // If mediaFileId is provided, verify it belongs to organization
    if (validated.mediaFileId) {
      const mediaFile = await prisma.mediaFile.findFirst({
        where: {
          id: validated.mediaFileId,
          organizationId,
        },
      });

      if (!mediaFile) {
        return NextResponse.json(
          { error: "Media file not found" },
          { status: 404 }
        );
      }
    }

    const advertisement = await prisma.advertisement.create({
      data: {
        campaignId: validated.campaignId,
        title: validated.title,
        description: validated.description,
        duration: validated.duration,
        mediaFileId: validated.mediaFileId,
        status: validated.status || "ACTIVE",
        totalPlays: 0,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
        mediaFile: true,
      },
    });

    return NextResponse.json(
      {
        data: advertisement,
        message: "Advertisement created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating advertisement:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 }
    );
  }
}
