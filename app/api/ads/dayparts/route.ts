import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdDaypartSchema,
  adDaypartFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/dayparts - List dayparts
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
      isActive: searchParams.get("isActive") === "true" ? true :
                searchParams.get("isActive") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = adDaypartFilterSchema.parse(filterInput);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }

    if (validated.search) {
      where.name = { contains: validated.search, mode: "insensitive" };
    }

    // Fetch dayparts
    const [dayparts, total] = await Promise.all([
      prisma.adDaypart.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { startTime: "asc" },
        include: {
          _count: {
            select: {
              packages: true,
              campaigns: true,
            },
          },
        },
      }),
      prisma.adDaypart.count({ where }),
    ]);

    return NextResponse.json({
      data: dayparts,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching dayparts:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch dayparts" },
      { status: 500 }
    );
  }
}

// POST /api/ads/dayparts - Create daypart
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
    const validated = createAdDaypartSchema.parse(body);

    // Check if daypart name already exists
    const existing = await prisma.adDaypart.findFirst({
      where: {
        organizationId,
        name: validated.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A daypart with this name already exists" },
        { status: 400 }
      );
    }

    // Create daypart
    const daypart = await prisma.adDaypart.create({
      data: {
        organizationId,
        name: validated.name,
        startTime: validated.startTime,
        endTime: validated.endTime,
        monday: validated.monday,
        tuesday: validated.tuesday,
        wednesday: validated.wednesday,
        thursday: validated.thursday,
        friday: validated.friday,
        saturday: validated.saturday,
        sunday: validated.sunday,
        priceMultiplier: validated.priceMultiplier,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json(
      {
        data: daypart,
        message: "Daypart created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating daypart:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A daypart with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create daypart" },
      { status: 500 }
    );
  }
}
