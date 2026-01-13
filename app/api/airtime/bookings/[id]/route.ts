/**
 * Admin API: Single Airtime Booking
 * Get and update airtime booking details
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { airtimeBookingUpdateSchema } from "@/lib/validations/airtime.validation";
import { ZodError } from "zod";

// GET /api/airtime/bookings/[id] - Get booking details
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

    const booking = await prisma.airtimeBooking.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        package: true,
        djAccount: {
          select: {
            id: true,
            displayName: true,
            username: true,
            azuracastStreamerId: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...booking,
        paymentAmount: Number(booking.paymentAmount),
        package: {
          ...booking.package,
          price: Number(booking.package.price),
          allowedDays: booking.package.allowedDays
            ? JSON.parse(booking.package.allowedDays)
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching airtime booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT /api/airtime/bookings/[id] - Update booking
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

    // Check if booking exists
    const booking = await prisma.airtimeBooking.findFirst({
      where: { id, organizationId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = airtimeBookingUpdateSchema.parse(body);

    // Update booking
    const updatedBooking = await prisma.airtimeBooking.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.adminNotes !== undefined && {
          adminNotes: validatedData.adminNotes,
        }),
        ...(validatedData.approvedDate && {
          approvedDate: new Date(validatedData.approvedDate),
        }),
        ...(validatedData.approvedStartTime && {
          approvedStartTime: validatedData.approvedStartTime,
        }),
        ...(validatedData.approvedEndTime && {
          approvedEndTime: validatedData.approvedEndTime,
        }),
        reviewedById: userId,
        reviewedAt: new Date(),
      },
      include: {
        package: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId,
        action: "UPDATE",
        resource: "airtime_booking",
        resourceId: id,
        description: `Updated airtime booking: ${booking.bookingRef}`,
      },
    });

    return NextResponse.json({
      data: {
        ...updatedBooking,
        paymentAmount: Number(updatedBooking.paymentAmount),
        package: {
          ...updatedBooking.package,
          price: Number(updatedBooking.package.price),
        },
      },
    });
  } catch (error) {
    console.error("Error updating airtime booking:", error);

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
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
