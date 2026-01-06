import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  recordAdPlaySchema,
  adPlayHistoryFilterSchema,
} from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";
import { CampaignFulfillmentStatus } from "@prisma/client";

// Helper to determine current daypart name
async function getCurrentDaypartName(
  organizationId: string,
  time?: Date
): Promise<string | null> {
  const now = time || new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${hours}:${minutes}`;
  const dayOfWeek = now.getDay();

  const dayFields: Record<number, string> = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  const daypart = await prisma.adDaypart.findFirst({
    where: {
      organizationId,
      isActive: true,
      startTime: { lte: currentTime },
      endTime: { gte: currentTime },
      [dayFields[dayOfWeek]]: true,
    },
    select: { name: true },
  });

  return daypart?.name || null;
}

// Helper to calculate fulfillment status
function calculateFulfillmentStatus(
  targetPlays: number | null,
  completedPlays: number,
  startDate: Date,
  endDate: Date
): CampaignFulfillmentStatus {
  if (!targetPlays || targetPlays === 0) {
    return "IN_PROGRESS";
  }

  const now = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const completionRate = completedPlays / targetPlays;
  const expectedRate = Math.min(elapsedDays / totalDays, 1);

  if (completedPlays >= targetPlays) {
    return completedPlays > targetPlays ? "OVER_DELIVERED" : "COMPLETED";
  }

  if (completionRate >= expectedRate * 0.9) {
    return "ON_TRACK";
  }

  if (completedPlays > 0) {
    return "BEHIND";
  }

  return "IN_PROGRESS";
}

// POST /api/ads/play - Record ad play with full context
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

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
    const validated = recordAdPlaySchema.parse(body);

    // Verify advertisement belongs to organization
    const advertisement = await prisma.advertisement.findFirst({
      where: {
        id: validated.advertisementId,
        campaign: {
          organizationId,
        },
      },
      include: {
        campaign: true,
        mediaFile: true,
      },
    });

    if (!advertisement) {
      return NextResponse.json({ error: "Advertisement not found" }, { status: 404 });
    }

    // Verify ad slot if provided
    let adSlot = null;
    if (validated.adSlotId) {
      adSlot = await prisma.adSlot.findFirst({
        where: {
          id: validated.adSlotId,
          advertisementId: validated.advertisementId,
        },
      });

      if (!adSlot) {
        return NextResponse.json({ error: "Ad slot not found" }, { status: 404 });
      }
    }

    // Verify program if provided
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

    // Verify presenter if provided
    if (validated.presenterId) {
      const presenter = await prisma.user.findFirst({
        where: {
          id: validated.presenterId,
          organizationId,
        },
      });

      if (!presenter) {
        return NextResponse.json(
          { error: "Presenter not found" },
          { status: 404 }
        );
      }
    }

    // Get current daypart name if not provided
    const now = new Date();
    const daypartName = validated.daypartName || await getCurrentDaypartName(organizationId, now);

    // Record play in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create play history record
      const playHistory = await tx.adPlayHistory.create({
        data: {
          organizationId,
          advertisementId: validated.advertisementId,
          adSlotId: validated.adSlotId,
          playDuration: validated.playDuration,
          programId: validated.programId,
          presenterId: validated.presenterId || userId,
          daypartName,
          playStatus: validated.playStatus,
          timeOfDay: `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
          dayOfWeek: now.getDay(),
          notes: validated.notes,
        },
        include: {
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          presenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Mark ad slot as played if provided
      if (validated.adSlotId) {
        await tx.adSlot.update({
          where: { id: validated.adSlotId },
          data: {
            wasPlayed: true,
            playedAt: now,
          },
        });
      }

      // Update advertisement total plays (only for COMPLETED plays)
      if (validated.playStatus === "COMPLETED") {
        await tx.advertisement.update({
          where: { id: validated.advertisementId },
          data: {
            totalPlays: {
              increment: 1,
            },
          },
        });

        // Update campaign completed plays and fulfillment status
        const updatedCampaign = await tx.adCampaign.update({
          where: { id: advertisement.campaignId },
          data: {
            completedPlays: {
              increment: 1,
            },
          },
        });

        // Calculate and update fulfillment status
        const newFulfillmentStatus = calculateFulfillmentStatus(
          updatedCampaign.targetPlays,
          updatedCampaign.completedPlays,
          updatedCampaign.startDate,
          updatedCampaign.endDate
        );

        if (newFulfillmentStatus !== updatedCampaign.fulfillmentStatus) {
          await tx.adCampaign.update({
            where: { id: advertisement.campaignId },
            data: {
              fulfillmentStatus: newFulfillmentStatus,
            },
          });
        }
      }

      // If mediaFile is linked, update its usage count
      if (advertisement.mediaFileId) {
        await tx.mediaFile.update({
          where: { id: advertisement.mediaFileId },
          data: {
            usageCount: {
              increment: 1,
            },
            lastUsedAt: now,
          },
        });
      }

      return playHistory;
    });

    return NextResponse.json(
      {
        data: result,
        message: "Ad play recorded successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error recording ad play:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record ad play" },
      { status: 500 }
    );
  }
}

// GET /api/ads/play - Get play history with filters
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

    const searchParams = request.nextUrl.searchParams;
    const filterInput = {
      advertisementId: searchParams.get("advertisementId") || undefined,
      campaignId: searchParams.get("campaignId") || undefined,
      programId: searchParams.get("programId") || undefined,
      presenterId: searchParams.get("presenterId") || undefined,
      playStatus: searchParams.get("playStatus") || undefined,
      daypartName: searchParams.get("daypartName") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      dayOfWeek: searchParams.get("dayOfWeek")
        ? parseInt(searchParams.get("dayOfWeek")!)
        : undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = adPlayHistoryFilterSchema.parse(filterInput);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (validated.advertisementId) {
      where.advertisementId = validated.advertisementId;
    }

    if (validated.campaignId) {
      where.advertisement = {
        campaignId: validated.campaignId,
      };
    }

    if (validated.programId) {
      where.programId = validated.programId;
    }

    if (validated.presenterId) {
      where.presenterId = validated.presenterId;
    }

    if (validated.playStatus) {
      where.playStatus = validated.playStatus;
    }

    if (validated.daypartName) {
      where.daypartName = { contains: validated.daypartName, mode: "insensitive" };
    }

    if (validated.startDate) {
      where.playedAt = { ...where.playedAt, gte: new Date(validated.startDate) };
    }

    if (validated.endDate) {
      where.playedAt = { ...where.playedAt, lte: new Date(validated.endDate) };
    }

    if (validated.dayOfWeek !== undefined) {
      where.dayOfWeek = validated.dayOfWeek;
    }

    const [playHistory, total] = await Promise.all([
      prisma.adPlayHistory.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { playedAt: "desc" },
        include: {
          advertisement: {
            select: {
              id: true,
              title: true,
              duration: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  client: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          program: {
            select: {
              id: true,
              name: true,
            },
          },
          presenter: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.adPlayHistory.count({ where }),
    ]);

    // Calculate summary stats
    const stats = {
      totalPlays: total,
      completedPlays: await prisma.adPlayHistory.count({
        where: { ...where, playStatus: "COMPLETED" },
      }),
      partialPlays: await prisma.adPlayHistory.count({
        where: { ...where, playStatus: "PARTIAL" },
      }),
      skippedPlays: await prisma.adPlayHistory.count({
        where: { ...where, playStatus: "SKIPPED" },
      }),
      failedPlays: await prisma.adPlayHistory.count({
        where: { ...where, playStatus: "FAILED" },
      }),
    };

    return NextResponse.json({
      data: playHistory,
      total,
      stats,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching play history:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch play history" },
      { status: 500 }
    );
  }
}
