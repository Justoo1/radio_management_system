import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdDaypartSchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/dayparts/[id] - Get single daypart
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

    const daypart = await prisma.adDaypart.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        packages: {
          select: {
            id: true,
            name: true,
            packageType: true,
            basePrice: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            packages: true,
            campaigns: true,
          },
        },
      },
    });

    if (!daypart) {
      return NextResponse.json(
        { error: "Daypart not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: daypart });
  } catch (error: any) {
    console.error("Error fetching daypart:", error);
    return NextResponse.json(
      { error: "Failed to fetch daypart" },
      { status: 500 }
    );
  }
}

// PATCH /api/ads/dayparts/[id] - Update daypart
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

    // Check if daypart exists
    const existing = await prisma.adDaypart.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Daypart not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateAdDaypartSchema.parse(body);

    // Check for name uniqueness if name is being updated
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.adDaypart.findFirst({
        where: {
          organizationId,
          name: validated.name,
          NOT: { id },
        },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "A daypart with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update daypart
    const daypart = await prisma.adDaypart.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.startTime && { startTime: validated.startTime }),
        ...(validated.endTime && { endTime: validated.endTime }),
        ...(validated.monday !== undefined && { monday: validated.monday }),
        ...(validated.tuesday !== undefined && { tuesday: validated.tuesday }),
        ...(validated.wednesday !== undefined && { wednesday: validated.wednesday }),
        ...(validated.thursday !== undefined && { thursday: validated.thursday }),
        ...(validated.friday !== undefined && { friday: validated.friday }),
        ...(validated.saturday !== undefined && { saturday: validated.saturday }),
        ...(validated.sunday !== undefined && { sunday: validated.sunday }),
        ...(validated.priceMultiplier !== undefined && { priceMultiplier: validated.priceMultiplier }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    return NextResponse.json({
      data: daypart,
      message: "Daypart updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating daypart:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update daypart" },
      { status: 500 }
    );
  }
}

// DELETE /api/ads/dayparts/[id] - Delete daypart
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

    // Check if daypart exists
    const existing = await prisma.adDaypart.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        _count: {
          select: {
            packages: true,
            campaigns: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Daypart not found" },
        { status: 404 }
      );
    }

    // Check if daypart is in use
    if (existing._count.packages > 0 || existing._count.campaigns > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete daypart that is in use",
          details: {
            packages: existing._count.packages,
            campaigns: existing._count.campaigns,
          }
        },
        { status: 400 }
      );
    }

    // Delete daypart
    await prisma.adDaypart.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Daypart deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting daypart:", error);
    return NextResponse.json(
      { error: "Failed to delete daypart" },
      { status: 500 }
    );
  }
}
