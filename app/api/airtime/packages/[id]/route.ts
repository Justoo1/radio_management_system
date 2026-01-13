/**
 * Admin API: Single Airtime Package
 * Get, update, delete airtime package
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { airtimePackageUpdateSchema } from "@/lib/validations/airtime.validation";
import { ZodError } from "zod";

// GET /api/airtime/packages/[id] - Get single package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    const pkg = await prisma.airtimePackage.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...pkg,
        price: Number(pkg.price),
        allowedDays: pkg.allowedDays ? JSON.parse(pkg.allowedDays) : null,
        bookingsCount: pkg._count.bookings,
      },
    });
  } catch (error) {
    console.error("Error fetching airtime package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
      { status: 500 }
    );
  }
}

// PUT /api/airtime/packages/[id] - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if package exists
    const existingPackage = await prisma.airtimePackage.findFirst({
      where: { id, organizationId },
    });

    if (!existingPackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = airtimePackageUpdateSchema.parse(body);

    // Check for duplicate name if name is being changed
    if (validatedData.name && validatedData.name !== existingPackage.name) {
      const duplicateName = await prisma.airtimePackage.findFirst({
        where: {
          organizationId,
          name: validatedData.name,
          NOT: { id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: "A package with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Update package
    const updatedPackage = await prisma.airtimePackage.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
        ...(validatedData.durationMinutes && {
          durationMinutes: validatedData.durationMinutes,
        }),
        ...(validatedData.price !== undefined && { price: validatedData.price }),
        ...(validatedData.currency && { currency: validatedData.currency }),
        ...(validatedData.isActive !== undefined && {
          isActive: validatedData.isActive,
        }),
        ...(validatedData.sortOrder !== undefined && {
          sortOrder: validatedData.sortOrder,
        }),
        ...(validatedData.allowedDays !== undefined && {
          allowedDays: validatedData.allowedDays
            ? JSON.stringify(validatedData.allowedDays)
            : null,
        }),
        ...(validatedData.allowedHoursStart !== undefined && {
          allowedHoursStart: validatedData.allowedHoursStart,
        }),
        ...(validatedData.allowedHoursEnd !== undefined && {
          allowedHoursEnd: validatedData.allowedHoursEnd,
        }),
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "UPDATE",
        resource: "airtime_package",
        resourceId: id,
        description: `Updated airtime package: ${updatedPackage.name}`,
      },
    });

    return NextResponse.json({
      data: {
        ...updatedPackage,
        price: Number(updatedPackage.price),
        allowedDays: updatedPackage.allowedDays
          ? JSON.parse(updatedPackage.allowedDays)
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating airtime package:", error);

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
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

// DELETE /api/airtime/packages/[id] - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "delete")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Check if package exists
    const pkg = await prisma.airtimePackage.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package has any bookings
    if (pkg._count.bookings > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete package with existing bookings. Deactivate it instead.",
          bookingsCount: pkg._count.bookings,
        },
        { status: 400 }
      );
    }

    // Delete package
    await prisma.airtimePackage.delete({
      where: { id },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "DELETE",
        resource: "airtime_package",
        resourceId: id,
        description: `Deleted airtime package: ${pkg.name}`,
      },
    });

    return NextResponse.json({
      message: "Package deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting airtime package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
