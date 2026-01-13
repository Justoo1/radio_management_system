/**
 * Admin API: Approve Airtime Booking
 * Approves a booking and creates AzuraCast DJ account with schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { airtimeBookingApproveSchema } from "@/lib/validations/airtime.validation";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import { ZodError } from "zod";
import crypto from "crypto";

// Generate secure random password
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

// Generate DJ username from guest name
function generateDjUsername(guestName: string, bookingRef: string): string {
  const cleanName = guestName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  const suffix = bookingRef.slice(-6).toLowerCase();
  return `guest_${cleanName}_${suffix}`;
}

// POST /api/airtime/bookings/[id]/approve - Approve booking
export async function POST(
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

    const body = await request.json();
    const validatedData = airtimeBookingApproveSchema.parse(body);

    // Get booking with package info
    const booking = await prisma.airtimeBooking.findFirst({
      where: { id, organizationId },
      include: {
        package: true,
        organization: {
          include: {
            streamingConfig: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be approved
    if (booking.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          error: "Only bookings with PENDING_REVIEW status can be approved",
          currentStatus: booking.status,
        },
        { status: 400 }
      );
    }

    // Check if payment was completed
    if (booking.paymentStatus !== "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot approve booking without completed payment" },
        { status: 400 }
      );
    }

    // Check if streaming is configured
    if (!booking.organization.streamingConfig?.azuracastStationId) {
      return NextResponse.json(
        { error: "Streaming is not configured for this organization" },
        { status: 400 }
      );
    }

    // Calculate end time based on package duration
    const approvedDate = new Date(validatedData.approvedDate);
    const [startHour, startMin] = validatedData.approvedStartTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = startMinutes + booking.package.durationMinutes;
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    const approvedEndTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // Generate DJ credentials
    const djUsername = generateDjUsername(booking.guestName, booking.bookingRef);
    const djPassword = generatePassword(12);

    // Create DJ account in AzuraCast with schedule enforcement
    let azuracastStreamerId: number | undefined;

    try {
      const azuracast = createAzuraCastService();
      const stationId = booking.organization.streamingConfig.azuracastStationId;

      // Calculate day of week for schedule (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = approvedDate.getDay();

      // Create streamer with schedule
      const streamer = await azuracast.createStreamer(stationId, {
        username: djUsername,
        password: djPassword,
        displayName: `${booking.guestName} (${booking.bookingRef})`,
        isActive: true,
        comments: `Airtime booking: ${booking.programTitle}`,
        enforceSchedule: true,
        scheduleItems: [
          {
            start_time: validatedData.approvedStartTime,
            end_time: approvedEndTime,
            start_date: approvedDate.toISOString().split("T")[0],
            end_date: approvedDate.toISOString().split("T")[0],
            days: [dayOfWeek],
          },
        ],
      });

      azuracastStreamerId = streamer.id;
    } catch (azuraError) {
      console.error("Failed to create AzuraCast streamer:", azuraError);
      // Continue without AzuraCast - credentials will still be stored locally
    }

    // Create DJ account in database
    const djAccount = await prisma.streamDJAccount.create({
      data: {
        streamingConfigId: booking.organization.streamingConfig.id,
        displayName: `${booking.guestName} (Guest)`,
        username: djUsername,
        password: djPassword, // Store plain for guest access
        isActive: true,
        canBroadcast: true,
        azuracastStreamerId,
      },
    });

    // Update booking with approval
    const updatedBooking = await prisma.airtimeBooking.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedDate,
        approvedStartTime: validatedData.approvedStartTime,
        approvedEndTime,
        adminNotes: validatedData.adminNotes,
        reviewedById: userId,
        reviewedAt: new Date(),
        djAccountId: djAccount.id,
        djUsername,
        djPassword, // Store for guest access in portal
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
        action: "APPROVE",
        resource: "airtime_booking",
        resourceId: id,
        description: `Approved airtime booking: ${booking.bookingRef}`,
      },
    });

    // TODO: Send approval email with credentials
    // await sendApprovalEmail(updatedBooking)

    return NextResponse.json({
      success: true,
      message: "Booking approved successfully",
      data: {
        ...updatedBooking,
        paymentAmount: Number(updatedBooking.paymentAmount),
        package: {
          ...updatedBooking.package,
          price: Number(updatedBooking.package.price),
        },
        credentials: {
          username: djUsername,
          password: djPassword,
        },
      },
    });
  } catch (error) {
    console.error("Error approving airtime booking:", error);

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
      { error: "Failed to approve booking" },
      { status: 500 }
    );
  }
}
