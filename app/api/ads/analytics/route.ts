import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/analytics - Get overall advertising analytics
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
      select: { enabledFeatures: true, currency: true },
    });

    if (!hasFeature(organization, "advertisements")) {
      return NextResponse.json(
        { error: "Advertisements feature not enabled" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Campaign statistics
    const [
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      campaigns,
    ] = await Promise.all([
      prisma.adCampaign.count({
        where: { organizationId },
      }),
      prisma.adCampaign.count({
        where: { organizationId, status: "ACTIVE" },
      }),
      prisma.adCampaign.count({
        where: { organizationId, fulfillmentStatus: { in: ["COMPLETED", "OVER_DELIVERED"] } },
      }),
      prisma.adCampaign.findMany({
        where: {
          organizationId,
          ...(Object.keys(dateFilter).length > 0 ? { startDate: dateFilter } : {}),
        },
        select: {
          id: true,
          name: true,
          budget: true,
          targetPlays: true,
          completedPlays: true,
          fulfillmentStatus: true,
          invoiceId: true,
          package: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              daypart: {
                select: {
                  priceMultiplier: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate revenue from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        adCampaign: { isNot: null },
        ...(Object.keys(dateFilter).length > 0 ? { issueDate: dateFilter } : {}),
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        adCampaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalInvoicedRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );
    const paidRevenue = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const pendingRevenue = invoices
      .filter((inv) => inv.status !== "PAID" && inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // Calculate potential revenue from campaigns with packages
    const potentialRevenue = campaigns.reduce((sum, campaign) => {
      if (campaign.package) {
        const basePrice = Number(campaign.package.basePrice);
        const multiplier = Number(campaign.package.daypart?.priceMultiplier || 1);
        return sum + basePrice * multiplier;
      }
      return sum + Number(campaign.budget || 0);
    }, 0);

    // Play history statistics
    const playStats = await prisma.adPlayHistory.groupBy({
      by: ["playStatus"],
      where: {
        organizationId,
        ...(Object.keys(dateFilter).length > 0 ? { playedAt: dateFilter } : {}),
      },
      _count: true,
    });

    const playStatsSummary = playStats.reduce((acc, stat) => {
      acc[stat.playStatus] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    const totalPlays = Object.values(playStatsSummary).reduce((a, b) => a + b, 0);

    // Play distribution by daypart
    const playsByDaypart = await prisma.adPlayHistory.groupBy({
      by: ["daypartName"],
      where: {
        organizationId,
        daypartName: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { playedAt: dateFilter } : {}),
      },
      _count: true,
    });

    // Top performing programs
    const playsByProgram = await prisma.adPlayHistory.groupBy({
      by: ["programId"],
      where: {
        organizationId,
        programId: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { playedAt: dateFilter } : {}),
      },
      _count: true,
      orderBy: {
        _count: {
          programId: "desc",
        },
      },
      take: 10,
    });

    // Get program names
    const programIds = playsByProgram.map((p) => p.programId!);
    const programs = await prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true, name: true },
    });
    const programMap = new Map(programs.map((p) => [p.id, p.name]));

    // Package statistics
    const packageStats = await prisma.adPackage.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        packageType: true,
        basePrice: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      orderBy: {
        campaigns: {
          _count: "desc",
        },
      },
      take: 5,
    });

    // Daypart performance
    const daypartStats = await prisma.adDaypart.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        priceMultiplier: true,
        _count: {
          select: {
            packages: true,
            campaigns: true,
          },
        },
      },
    });

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyInvoices = await prisma.invoice.findMany({
      where: {
        organizationId,
        adCampaign: { isNot: null },
        issueDate: { gte: sixMonthsAgo },
      },
      select: {
        totalAmount: true,
        issueDate: true,
        status: true,
      },
    });

    const monthlyRevenue: Record<string, { total: number; paid: number }> = {};
    monthlyInvoices.forEach((inv) => {
      const monthKey = inv.issueDate.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = { total: 0, paid: 0 };
      }
      monthlyRevenue[monthKey].total += Number(inv.totalAmount);
      if (inv.status === "PAID") {
        monthlyRevenue[monthKey].paid += Number(inv.totalAmount);
      }
    });

    // Fulfillment status distribution
    const fulfillmentStats = await prisma.adCampaign.groupBy({
      by: ["fulfillmentStatus"],
      where: { organizationId },
      _count: true,
    });

    const fulfillmentDistribution = fulfillmentStats.reduce((acc, stat) => {
      acc[stat.fulfillmentStatus] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    // Campaigns needing attention (ready for invoice or behind schedule)
    const campaignsNeedingAttention = campaigns.filter(
      (c) =>
        (c.fulfillmentStatus === "COMPLETED" || c.fulfillmentStatus === "OVER_DELIVERED") &&
        !c.invoiceId
    );

    const campaignsBehind = campaigns.filter((c) => c.fulfillmentStatus === "BEHIND");

    return NextResponse.json({
      data: {
        summary: {
          totalCampaigns,
          activeCampaigns,
          completedCampaigns,
          totalPlays,
          completionRate:
            totalPlays > 0
              ? ((playStatsSummary["COMPLETED"] || 0) / totalPlays) * 100
              : 0,
        },
        revenue: {
          currency: organization?.currency || "GHS",
          potential: potentialRevenue,
          invoiced: totalInvoicedRevenue,
          paid: paidRevenue,
          pending: pendingRevenue,
          monthlyTrend: Object.entries(monthlyRevenue)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
              month,
              total: data.total,
              paid: data.paid,
            })),
        },
        plays: {
          total: totalPlays,
          byStatus: playStatsSummary,
          byDaypart: playsByDaypart.map((p) => ({
            name: p.daypartName || "Unknown",
            count: p._count,
          })),
          byProgram: playsByProgram.map((p) => ({
            id: p.programId,
            name: programMap.get(p.programId!) || "Unknown",
            count: p._count,
          })),
        },
        fulfillment: {
          distribution: fulfillmentDistribution,
          readyForInvoice: campaignsNeedingAttention.map((c) => ({
            id: c.id,
            name: c.name,
            completedPlays: c.completedPlays,
            status: c.fulfillmentStatus,
          })),
          behindSchedule: campaignsBehind.map((c) => ({
            id: c.id,
            name: c.name,
            targetPlays: c.targetPlays,
            completedPlays: c.completedPlays,
          })),
        },
        topPackages: packageStats.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.packageType,
          price: Number(p.basePrice),
          campaignsUsing: p._count.campaigns,
        })),
        daypartPerformance: daypartStats.map((d) => ({
          id: d.id,
          name: d.name,
          multiplier: Number(d.priceMultiplier),
          packages: d._count.packages,
          campaigns: d._count.campaigns,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching advertising analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertising analytics" },
      { status: 500 }
    );
  }
}
