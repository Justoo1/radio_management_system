/**
 * Admin API: Reject Airtime Booking
 * Rejects a booking and initiates refund
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { airtimeBookingRejectSchema } from "@/lib/validations/airtime.validation";
import { getPaystackService, ghsToPesewas } from "@/lib/integrations/paystack";
import { ZodError } from "zod";

// POST /api/airtime/bookings/[id]/reject - Reject booking
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
    const validatedData = airtimeBookingRejectSchema.parse(body);

    // Get booking
    const booking = await prisma.airtimeBooking.findFirst({
      where: { id, organizationId },
      include: {
        package: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be rejected
    if (booking.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          error: "Only bookings with PENDING_REVIEW status can be rejected",
          currentStatus: booking.status,
        },
        { status: 400 }
      );
    }

    // Initiate refund if payment was completed
    let refundInitiated = false;
    let refundError: string | null = null;

    if (booking.paymentStatus === "COMPLETED" && booking.paymentReference) {
      try {
        const paystack = getPaystackService();
        await paystack.initiateRefund(booking.paymentReference, {
          customerNote: `Refund for airtime booking ${booking.bookingRef}: ${validatedData.reason}`,
          merchantNote: `Admin rejection: ${validatedData.reason}`,
        });
        refundInitiated = true;
      } catch (error) {
        console.error("Failed to initiate refund:", error);
        refundError = error instanceof Error ? error.message : "Unknown error";
        // Continue with rejection even if refund fails
        // Admin can manually process refund later
      }
    }

    // Update booking
    const updatedBooking = await prisma.airtimeBooking.update({
      where: { id },
      data: {
        status: "REJECTED",
        refundReason: validatedData.reason,
        adminNotes: `Rejected: ${validatedData.reason}${refundError ? ` (Refund error: ${refundError})` : ""}`,
        reviewedById: userId,
        reviewedAt: new Date(),
        // Mark refund as pending if initiated
        ...(refundInitiated && {
          paymentStatus: "REFUNDED",
          refundedAt: new Date(),
        }),
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
        action: "REJECT",
        resource: "airtime_booking",
        resourceId: id,
        description: `Rejected airtime booking: ${booking.bookingRef} - ${validatedData.reason}`,
      },
    });

    // TODO: Send rejection email
    // await sendRejectionEmail(updatedBooking, validatedData.reason)

    return NextResponse.json({
      success: true,
      message: refundInitiated
        ? "Booking rejected and refund initiated"
        : "Booking rejected",
      refundInitiated,
      refundError,
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
    console.error("Error rejecting airtime booking:", error);

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
      { error: "Failed to reject booking" },
      { status: 500 }
    );
  }
}
