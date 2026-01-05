import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAdPlaySchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// POST /api/ads/play - Record ad play
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

    // Verify ad slot belongs to organization
    const adSlot = await prisma.adSlot.findFirst({
      where: {
        id: validated.adSlotId,
        advertisement: {
          campaign: {
            organizationId,
          },
        },
      },
      include: {
        advertisement: {
          include: {
            campaign: true,
            mediaFile: true,
          },
        },
      },
    });

    if (!adSlot) {
      return NextResponse.json({ error: "Ad slot not found" }, { status: 404 });
    }

    // If programId provided, verify it
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

    // Record play in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark ad slot as played
      const updatedSlot = await tx.adSlot.update({
        where: { id: validated.adSlotId },
        data: {
          wasPlayed: true,
          playedAt: new Date(),
        },
      });

      // Update advertisement total plays
      await tx.advertisement.update({
        where: { id: adSlot.advertisementId },
        data: {
          totalPlays: {
            increment: 1,
          },
        },
      });

      // If mediaFile is linked, update its usage count
      if (adSlot.advertisement.mediaFileId) {
        await tx.mediaFile.update({
          where: { id: adSlot.advertisement.mediaFileId },
          data: {
            usageCount: {
              increment: 1,
            },
            lastUsedAt: new Date(),
          },
        });
      }

      return updatedSlot;
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

// GET /api/ads/play - Get played ad slots
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
    const advertisementId = searchParams.get("advertisementId");
    const campaignId = searchParams.get("campaignId");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      wasPlayed: true,
      advertisement: {
        campaign: {
          organizationId,
        },
      },
    };

    if (advertisementId) {
      where.advertisementId = advertisementId;
    }

    if (campaignId) {
      where.advertisement = {
        ...where.advertisement,
        campaignId,
      };
    }

    const [playedSlots, total] = await Promise.all([
      prisma.adSlot.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { playedAt: "desc" },
        include: {
          advertisement: {
            select: {
              id: true,
              title: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.adSlot.count({ where }),
    ]);

    return NextResponse.json({
      data: playedSlots,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Error fetching played ad slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch played ad slots" },
      { status: 500 }
    );
  }
}
