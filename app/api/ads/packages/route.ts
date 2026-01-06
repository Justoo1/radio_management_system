import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdPackageSchema,
  adPackageFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/packages - List packages
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
      packageType: searchParams.get("packageType") || undefined,
      daypartId: searchParams.get("daypartId") || undefined,
      programId: searchParams.get("programId") || undefined,
      isActive: searchParams.get("isActive") === "true" ? true :
                searchParams.get("isActive") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
      minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
      maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = adPackageFilterSchema.parse(filterInput);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (validated.packageType) {
      where.packageType = validated.packageType;
    }

    if (validated.daypartId) {
      where.daypartId = validated.daypartId;
    }

    if (validated.programId) {
      where.programId = validated.programId;
    }

    if (validated.isActive !== undefined) {
      where.isActive = validated.isActive;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { description: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    if (validated.minPrice !== undefined) {
      where.basePrice = { ...where.basePrice, gte: validated.minPrice };
    }

    if (validated.maxPrice !== undefined) {
      where.basePrice = { ...where.basePrice, lte: validated.maxPrice };
    }

    // Fetch packages
    const [packages, total] = await Promise.all([
      prisma.adPackage.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { createdAt: "desc" },
        include: {
          daypart: {
            select: {
              id: true,
              name: true,
              startTime: true,
              endTime: true,
              priceMultiplier: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
      }),
      prisma.adPackage.count({ where }),
    ]);

    // Calculate effective price for each package
    const packagesWithEffectivePrice = packages.map((pkg) => {
      const multiplier = pkg.daypart?.priceMultiplier || 1;
      const effectivePrice = Number(pkg.basePrice) * Number(multiplier);

      // Calculate total plays for the package
      let calculatedPlays = pkg.totalPlays;
      if (pkg.packageType === "TIME_SLOT" && pkg.durationDays && pkg.playsPerDay) {
        calculatedPlays = pkg.durationDays * pkg.playsPerDay;
      }

      return {
        ...pkg,
        effectivePrice,
        calculatedPlays,
        pricePerPlay: calculatedPlays ? effectivePrice / calculatedPlays : null,
      };
    });

    return NextResponse.json({
      data: packagesWithEffectivePrice,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching packages:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

// POST /api/ads/packages - Create package
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
    const validated = createAdPackageSchema.parse(body);

    // Validate daypart if provided
    if (validated.daypartId) {
      const daypart = await prisma.adDaypart.findFirst({
        where: {
          id: validated.daypartId,
          organizationId,
        },
      });

      if (!daypart) {
        return NextResponse.json(
          { error: "Daypart not found" },
          { status: 404 }
        );
      }
    }

    // Validate program if provided
    if (validated.programId) {
      const program = await prisma.program.findFirst({
        where: {
          id: validated.programId,
          organizationId,
        },
      });

      if (!program) {
        return NextResponse.json(
          { error: "Program not found" },
          { status: 404 }
        );
      }
    }

    // Create package
    const adPackage = await prisma.adPackage.create({
      data: {
        organizationId,
        name: validated.name,
        description: validated.description,
        packageType: validated.packageType,
        totalPlays: validated.totalPlays,
        durationDays: validated.durationDays,
        playsPerDay: validated.playsPerDay,
        basePrice: validated.basePrice,
        currency: validated.currency,
        daypartId: validated.daypartId,
        programId: validated.programId,
        maxDuration: validated.maxDuration,
        isActive: validated.isActive,
      },
      include: {
        daypart: {
          select: {
            id: true,
            name: true,
            priceMultiplier: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: adPackage,
        message: "Package created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating package:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
