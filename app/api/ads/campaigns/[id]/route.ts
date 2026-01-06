import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdCampaignSchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/campaigns/[id] - Get single campaign with full details
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

    const { id } = await params;

    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        client: true,
        package: {
          include: {
            daypart: true,
            program: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        targetProgram: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDaypart: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
          },
        },
        advertisements: {
          include: {
            mediaFile: {
              select: {
                id: true,
                name: true,
                url: true,
                duration: true,
              },
            },
            slots: {
              orderBy: { scheduledDate: "asc" },
            },
            _count: {
              select: {
                playHistory: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Calculate comprehensive stats
    const totalAds = campaign.advertisements.length;
    const totalSlots = campaign.advertisements.reduce(
      (sum, ad) => sum + ad.slots.length,
      0
    );
    const playedSlots = campaign.advertisements.reduce(
      (sum, ad) => sum + ad.slots.filter(s => s.wasPlayed).length,
      0
    );
    const totalPlays = campaign.advertisements.reduce(
      (sum, ad) => sum + ad.totalPlays,
      0
    );

    // Get play history stats
    const playHistoryStats = await prisma.adPlayHistory.groupBy({
      by: ["playStatus"],
      where: {
        advertisement: {
          campaignId: id,
        },
      },
      _count: true,
    });

    const playStats = {
      completed: playHistoryStats.find(s => s.playStatus === "COMPLETED")?._count || 0,
      partial: playHistoryStats.find(s => s.playStatus === "PARTIAL")?._count || 0,
      skipped: playHistoryStats.find(s => s.playStatus === "SKIPPED")?._count || 0,
      failed: playHistoryStats.find(s => s.playStatus === "FAILED")?._count || 0,
    };

    // Calculate fulfillment percentage
    const fulfillmentRate = campaign.targetPlays
      ? Math.round((campaign.completedPlays / campaign.targetPlays) * 100)
      : null;

    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((campaign.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const totalDays = Math.ceil(
      (campaign.endDate.getTime() - campaign.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const elapsedDays = totalDays - daysRemaining;

    return NextResponse.json({
      data: {
        ...campaign,
        stats: {
          totalAds,
          totalSlots,
          playedSlots,
          totalPlays,
          completedPlays: campaign.completedPlays,
          targetPlays: campaign.targetPlays,
          fulfillmentRate,
          daysRemaining,
          totalDays,
          elapsedDays,
          playStats,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PATCH /api/ads/campaigns/[id] - Update campaign
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

    const { id } = await params;

    const existingCampaign = await prisma.adCampaign.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateAdCampaignSchema.parse(body);

    // Verify client if changing
    if (validated.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: validated.clientId,
          organizationId,
        },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }
    }

    // Verify package if provided
    if (validated.packageId) {
      const pkg = await prisma.adPackage.findFirst({
        where: {
          id: validated.packageId,
          organizationId,
        },
      });

      if (!pkg) {
        return NextResponse.json(
          { error: "Package not found" },
          { status: 404 }
        );
      }
    }

    // Verify target program if provided
    if (validated.targetProgramId) {
      const program = await prisma.program.findFirst({
        where: {
          id: validated.targetProgramId,
          organizationId,
        },
      });

      if (!program) {
        return NextResponse.json(
          { error: "Target program not found" },
          { status: 404 }
        );
      }
    }

    // Verify target daypart if provided
    if (validated.targetDaypartId) {
      const daypart = await prisma.adDaypart.findFirst({
        where: {
          id: validated.targetDaypartId,
          organizationId,
        },
      });

      if (!daypart) {
        return NextResponse.json(
          { error: "Target daypart not found" },
          { status: 404 }
        );
      }
    }

    // Build update data
    const updateData: any = {};

    if (validated.clientId !== undefined) updateData.clientId = validated.clientId;
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.budget !== undefined) updateData.budget = validated.budget;
    if (validated.startDate !== undefined) updateData.startDate = new Date(validated.startDate);
    if (validated.endDate !== undefined) updateData.endDate = new Date(validated.endDate);
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.packageId !== undefined) updateData.packageId = validated.packageId;
    if (validated.scheduleType !== undefined) updateData.scheduleType = validated.scheduleType;
    if (validated.targetPlays !== undefined) updateData.targetPlays = validated.targetPlays;
    if (validated.targetProgramId !== undefined) updateData.targetProgramId = validated.targetProgramId;
    if (validated.targetDaypartId !== undefined) updateData.targetDaypartId = validated.targetDaypartId;
    if (validated.fulfillmentStatus !== undefined) updateData.fulfillmentStatus = validated.fulfillmentStatus;

    const updatedCampaign = await prisma.adCampaign.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        package: true,
        targetProgram: {
          select: {
            id: true,
            name: true,
          },
        },
        targetDaypart: true,
        advertisements: {
          select: {
            id: true,
            title: true,
            totalPlays: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: updatedCampaign,
      message: "Campaign updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating campaign:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE /api/ads/campaigns/[id] - Delete campaign
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

    const { id } = await params;

    const existingCampaign = await prisma.adCampaign.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        invoice: true,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Warn if campaign has invoice
    if (existingCampaign.invoiceId) {
      return NextResponse.json(
        { error: "Cannot delete campaign with associated invoice. Delete or unlink the invoice first." },
        { status: 400 }
      );
    }

    // Delete campaign (cascade will handle advertisements, slots, and play history)
    await prisma.adCampaign.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Campaign deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
