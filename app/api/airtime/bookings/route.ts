/**
 * Admin API: Airtime Bookings
 * List and filter airtime bookings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { airtimeBookingsQuerySchema } from "@/lib/validations/airtime.validation";
import { Prisma } from "@prisma/client";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/airtime/bookings - List bookings with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check airtime feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.AIRTIME);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Airtime booking feature is not enabled for your organization. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = airtimeBookingsQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      guestType: searchParams.get("guestType") || undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
    });

    // Build where clause
    const where: Prisma.AirtimeBookingWhereInput = {
      organizationId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.guestType) {
      where.guestType = query.guestType;
    }

    if (query.fromDate) {
      where.requestedDate = {
        ...((where.requestedDate as Prisma.DateTimeFilter) || {}),
        gte: new Date(query.fromDate),
      };
    }

    if (query.toDate) {
      where.requestedDate = {
        ...((where.requestedDate as Prisma.DateTimeFilter) || {}),
        lte: new Date(query.toDate),
      };
    }

    if (query.search) {
      where.OR = [
        { bookingRef: { contains: query.search, mode: "insensitive" } },
        { guestName: { contains: query.search, mode: "insensitive" } },
        { guestEmail: { contains: query.search, mode: "insensitive" } },
        { programTitle: { contains: query.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.airtimeBooking.count({ where });

    // Get bookings with pagination
    const bookings = await prisma.airtimeBooking.findMany({
      where,
      include: {
        package: {
          select: {
            name: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    // Format response
    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      paymentAmount: Number(booking.paymentAmount),
    }));

    // Get stats
    const stats = await prisma.airtimeBooking.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: true,
    });

    const statusCounts = stats.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      data: formattedBookings,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      stats: {
        total,
        byStatus: statusCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching airtime bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
