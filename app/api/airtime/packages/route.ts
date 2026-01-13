/**
 * Admin API: Airtime Packages
 * List and create airtime packages
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { airtimePackageCreateSchema } from "@/lib/validations/airtime.validation";
import { ZodError } from "zod";

// GET /api/airtime/packages - List packages
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    const packages = await prisma.airtimePackage.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { durationMinutes: "asc" }],
    });

    // Format response
    const formattedPackages = packages.map((pkg) => ({
      ...pkg,
      price: Number(pkg.price),
      allowedDays: pkg.allowedDays ? JSON.parse(pkg.allowedDays) : null,
      bookingsCount: pkg._count.bookings,
    }));

    return NextResponse.json({ data: formattedPackages });
  } catch (error) {
    console.error("Error fetching airtime packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

// POST /api/airtime/packages - Create package
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

    // Check if streaming is configured
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Please configure streaming first before creating airtime packages" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = airtimePackageCreateSchema.parse(body);

    // Check for duplicate name
    const existingPackage = await prisma.airtimePackage.findFirst({
      where: {
        organizationId,
        name: validatedData.name,
      },
    });

    if (existingPackage) {
      return NextResponse.json(
        { error: "A package with this name already exists" },
        { status: 400 }
      );
    }

    // Create package
    const pkg = await prisma.airtimePackage.create({
      data: {
        organizationId,
        name: validatedData.name,
        description: validatedData.description,
        durationMinutes: validatedData.durationMinutes,
        price: validatedData.price,
        currency: validatedData.currency,
        isActive: validatedData.isActive,
        sortOrder: validatedData.sortOrder,
        allowedDays: validatedData.allowedDays
          ? JSON.stringify(validatedData.allowedDays)
          : null,
        allowedHoursStart: validatedData.allowedHoursStart,
        allowedHoursEnd: validatedData.allowedHoursEnd,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "CREATE",
        resource: "airtime_package",
        resourceId: pkg.id,
        description: `Created airtime package: ${pkg.name}`,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...pkg,
          price: Number(pkg.price),
          allowedDays: pkg.allowedDays ? JSON.parse(pkg.allowedDays) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating airtime package:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
