import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdPackageSchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/packages/[id] - Get single package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const { id } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const adPackage = await prisma.adPackage.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        daypart: true,
        program: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        campaigns: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!adPackage) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Calculate effective price
    const multiplier = adPackage.daypart?.priceMultiplier || 1;
    const effectivePrice = Number(adPackage.basePrice) * Number(multiplier);

    // Calculate total plays
    let calculatedPlays = adPackage.totalPlays;
    if (adPackage.packageType === "TIME_SLOT" && adPackage.durationDays && adPackage.playsPerDay) {
      calculatedPlays = adPackage.durationDays * adPackage.playsPerDay;
    }

    return NextResponse.json({
      data: {
        ...adPackage,
        effectivePrice,
        calculatedPlays,
        pricePerPlay: calculatedPlays ? effectivePrice / calculatedPlays : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// PATCH /api/ads/packages/[id] - Update package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const { id } = await params;

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

    // Check if package exists
    const existing = await prisma.adPackage.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateAdPackageSchema.parse(body);

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

    // Update package
    const adPackage = await prisma.adPackage.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.packageType && { packageType: validated.packageType }),
        ...(validated.totalPlays !== undefined && { totalPlays: validated.totalPlays }),
        ...(validated.durationDays !== undefined && { durationDays: validated.durationDays }),
        ...(validated.playsPerDay !== undefined && { playsPerDay: validated.playsPerDay }),
        ...(validated.basePrice !== undefined && { basePrice: validated.basePrice }),
        ...(validated.currency && { currency: validated.currency }),
        ...(validated.daypartId !== undefined && { daypartId: validated.daypartId }),
        ...(validated.programId !== undefined && { programId: validated.programId }),
        ...(validated.maxDuration !== undefined && { maxDuration: validated.maxDuration }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
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

    return NextResponse.json({
      data: adPackage,
      message: "Package updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating package:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE /api/ads/packages/[id] - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const { id } = await params;

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

    // Check if package exists
    const existing = await prisma.adPackage.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    // Check if package is in use
    if (existing._count.campaigns > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete package that is in use by campaigns",
          details: {
            campaigns: existing._count.campaigns,
          }
        },
        { status: 400 }
      );
    }

    // Delete package
    await prisma.adPackage.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Package deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
