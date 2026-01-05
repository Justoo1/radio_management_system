import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdSlotSchema,
  adSlotFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/slots - List ad slots
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
      advertisementId: searchParams.get("advertisementId") || undefined,
      wasPlayed: searchParams.get("wasPlayed") === "true" ? true : searchParams.get("wasPlayed") === "false" ? false : undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = adSlotFilterSchema.parse(filterInput);

    const where: any = {
      advertisement: {
        campaign: {
          organizationId,
        },
      },
    };

    if (validated.advertisementId) {
      where.advertisementId = validated.advertisementId;
    }

    if (validated.wasPlayed !== undefined) {
      where.wasPlayed = validated.wasPlayed;
    }

    const [adSlots, total] = await Promise.all([
      prisma.adSlot.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: [
          { scheduledDate: "asc" },
          { scheduledTime: "asc" },
        ],
        include: {
          advertisement: {
            select: {
              id: true,
              title: true,
              duration: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      prisma.adSlot.count({ where }),
    ]);

    return NextResponse.json({
      data: adSlots,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching ad slots:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch ad slots" },
      { status: 500 }
    );
  }
}

// POST /api/ads/slots - Create ad slot
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
    const validated = createAdSlotSchema.parse(body);

    // Verify advertisement belongs to organization's campaign
    const advertisement = await prisma.advertisement.findFirst({
      where: {
        id: validated.advertisementId,
        campaign: {
          organizationId,
        },
      },
    });

    if (!advertisement) {
      return NextResponse.json(
        { error: "Advertisement not found" },
        { status: 404 }
      );
    }

    const adSlot = await prisma.adSlot.create({
      data: {
        advertisementId: validated.advertisementId,
        scheduledDate: new Date(validated.scheduledDate || new Date()),
        scheduledTime: validated.timeSlot || "00:00",
        notes: validated.notes,
      },
      include: {
        advertisement: {
          select: {
            id: true,
            title: true,
            duration: true,
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: adSlot,
        message: "Ad slot created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ad slot:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create ad slot" },
      { status: 500 }
    );
  }
}
