import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAdCampaignSchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/campaigns/[id] - Get single campaign
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
        advertisements: {
          include: {
            mediaFile: true,
            slots: true,
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

    // Calculate stats from advertisements and their slots
    const totalAds = campaign.advertisements.length;
    const totalSlots = campaign.advertisements.reduce(
      (sum, ad) => sum + ad.slots.length,
      0
    );
    const totalPlayed = campaign.advertisements.reduce(
      (sum, ad) => sum + ad.slots.filter(s => s.wasPlayed).length,
      0
    );

    return NextResponse.json({
      data: {
        ...campaign,
        totalAds,
        totalSlots,
        totalPlayed,
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

    // If changing client, verify it belongs to organization
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

    const updateData: any = { ...validated };

    if (validated.startDate) {
      updateData.startDate = new Date(validated.startDate);
    }

    if (validated.endDate) {
      updateData.endDate = new Date(validated.endDate);
    }

    const updatedCampaign = await prisma.adCampaign.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        advertisements: true,
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
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Delete campaign (cascade will handle advertisements and their slots)
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
