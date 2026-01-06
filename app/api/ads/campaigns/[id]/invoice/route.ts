import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCampaignInvoiceSchema } from "@/lib/validations/advertisement.validation";
import { hasFeature } from "@/lib/subscription-access";

// POST /api/ads/campaigns/[id]/invoice - Generate invoice from campaign
export async function POST(
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
      select: { enabledFeatures: true, currency: true },
    });

    if (!hasFeature(organization, "advertisements")) {
      return NextResponse.json(
        { error: "Advertisements feature not enabled" },
        { status: 403 }
      );
    }

    const { id: campaignId } = await params;
    const body = await request.json();

    // Validate input (campaignId comes from URL)
    const validated = generateCampaignInvoiceSchema.parse({
      ...body,
      campaignId,
    });

    // Get campaign with full details
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
      include: {
        client: true,
        package: {
          include: {
            daypart: true,
          },
        },
        invoice: true,
        advertisements: {
          include: {
            playHistory: {
              where: {
                playStatus: "COMPLETED",
              },
              select: {
                id: true,
                playDuration: true,
                daypartName: true,
                programId: true,
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

    // Check if invoice already exists
    if (campaign.invoiceId) {
      return NextResponse.json(
        {
          error: "Invoice already exists for this campaign",
          invoiceId: campaign.invoiceId,
        },
        { status: 400 }
      );
    }

    // Calculate invoice amount
    let subtotal = 0;
    const invoiceItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }> = [];

    if (campaign.package) {
      // Package-based pricing
      const multiplier = Number(campaign.package.daypart?.priceMultiplier || 1);
      const basePrice = Number(campaign.package.basePrice);
      const effectivePrice = basePrice * multiplier;

      // Calculate plays delivered
      const totalPlays = campaign.advertisements.reduce(
        (sum, ad) => sum + ad.playHistory.length,
        0
      );

      if (campaign.package.packageType === "PLAY_COUNT") {
        // Charge based on actual plays delivered (up to package limit)
        const chargeablePlays = Math.min(totalPlays, campaign.package.totalPlays || totalPlays);
        const pricePerPlay = effectivePrice / (campaign.package.totalPlays || 1);

        invoiceItems.push({
          description: `${campaign.package.name} - ${chargeablePlays} plays delivered`,
          quantity: chargeablePlays,
          unitPrice: Number(pricePerPlay.toFixed(2)),
          amount: Number((chargeablePlays * pricePerPlay).toFixed(2)),
        });

        subtotal = chargeablePlays * pricePerPlay;
      } else if (campaign.package.packageType === "TIME_SLOT") {
        // Charge based on package price
        invoiceItems.push({
          description: `${campaign.package.name} - ${campaign.package.durationDays} days, ${campaign.package.playsPerDay} plays/day`,
          quantity: 1,
          unitPrice: effectivePrice,
          amount: effectivePrice,
        });

        subtotal = effectivePrice;
      } else {
        // Program-based or Daypart-based - use package price
        invoiceItems.push({
          description: `${campaign.package.name}`,
          quantity: 1,
          unitPrice: effectivePrice,
          amount: effectivePrice,
        });

        subtotal = effectivePrice;
      }

      // Add breakdown by daypart if requested
      if (validated.includeBreakdown) {
        const playsByDaypart: Record<string, number> = {};

        campaign.advertisements.forEach(ad => {
          ad.playHistory.forEach(play => {
            const daypart = play.daypartName || "Unspecified";
            playsByDaypart[daypart] = (playsByDaypart[daypart] || 0) + 1;
          });
        });

        // Add breakdown as notes (not separate line items)
        const breakdownNotes = Object.entries(playsByDaypart)
          .map(([daypart, count]) => `${daypart}: ${count} plays`)
          .join(", ");

        if (breakdownNotes) {
          invoiceItems[0].description += ` (${breakdownNotes})`;
        }
      }
    } else if (campaign.budget) {
      // Use budget as the amount
      subtotal = Number(campaign.budget);

      invoiceItems.push({
        description: `${campaign.name} - Advertising Campaign`,
        quantity: 1,
        unitPrice: subtotal,
        amount: subtotal,
      });
    } else {
      return NextResponse.json(
        { error: "Campaign has no package or budget to invoice" },
        { status: 400 }
      );
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });

    const nextNumber = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.replace(/\D/g, "")) + 1
      : 1;
    const invoiceNumber = `INV-${nextNumber.toString().padStart(5, "0")}`;

    // Calculate due date (default: 30 days from now)
    const dueDate = validated.dueDate
      ? new Date(validated.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          invoiceNumber,
          clientId: campaign.clientId,
          issueDate: new Date(),
          dueDate,
          subtotal,
          taxAmount: 0,
          discount: 0,
          totalAmount: subtotal,
          status: "DRAFT",
          notes: validated.notes || `Invoice for Ad Campaign: ${campaign.name}`,
          items: {
            create: invoiceItems.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          },
        },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Link invoice to campaign
      await tx.adCampaign.update({
        where: { id: campaignId },
        data: {
          invoiceId: invoice.id,
        },
      });

      return invoice;
    });

    return NextResponse.json(
      {
        data: result,
        message: "Invoice generated successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error generating invoice:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

// GET /api/ads/campaigns/[id]/invoice - Get campaign invoice
export async function GET(
  _request: NextRequest,
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

    const { id: campaignId } = await params;

    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        invoiceId: true,
        invoice: {
          include: {
            items: true,
            payments: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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

    if (!campaign.invoice) {
      return NextResponse.json(
        { error: "No invoice found for this campaign" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: campaign.invoice,
    });
  } catch (error: any) {
    console.error("Error fetching campaign invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign invoice" },
      { status: 500 }
    );
  }
}
