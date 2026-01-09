import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { getCreditUsage } from "@/lib/services/sms-credits";

/**
 * GET /api/sms/analytics
 * Get SMS campaign analytics and statistics
 */
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

    // Check feature access
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { enabledFeatures: true },
    });

    if (!hasFeature(organization, "sms_campaigns")) {
      return NextResponse.json(
        { error: "SMS campaigns feature not enabled" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all campaigns for this organization
    const campaigns = await prisma.sMSCampaign.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
        sentAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    // Get message statistics
    const messages = await prisma.sMSMessage.findMany({
      where: {
        campaign: {
          organizationId,
        },
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        sentAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    });

    // Get credit usage
    const creditUsage = await getCreditUsage(organizationId);

    // Calculate summary statistics
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(
      (c) => c.status === "PROCESSING" || c.status === "SCHEDULED"
    ).length;
    const completedCampaigns = campaigns.filter(
      (c) => c.status === "SENT" || c.status === "COMPLETED"
    ).length;

    const totalSent = messages.filter(
      (m) => m.status === "SENT" || m.status === "DELIVERED"
    ).length;
    const totalDelivered = messages.filter((m) => m.status === "DELIVERED").length;
    const totalFailed = messages.filter(
      (m) => m.status === "FAILED" || m.status === "REJECTED"
    ).length;

    const deliveryRate =
      totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

    // Messages by status
    const byStatus = messages.reduce(
      (acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Messages by day
    const byDay: Record<string, { sent: number; delivered: number; failed: number }> = {};
    messages.forEach((m) => {
      const date = new Date(m.createdAt).toISOString().split("T")[0];
      if (!byDay[date]) {
        byDay[date] = { sent: 0, delivered: 0, failed: 0 };
      }
      if (m.status === "SENT" || m.status === "DELIVERED") {
        byDay[date].sent++;
      }
      if (m.status === "DELIVERED") {
        byDay[date].delivered++;
      }
      if (m.status === "FAILED" || m.status === "REJECTED") {
        byDay[date].failed++;
      }
    });

    // Convert to sorted array
    const dailyStats = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        ...stats,
      }));

    // Top campaigns by delivery
    const topCampaigns = campaigns
      .filter((c) => c.totalRecipients > 0)
      .sort((a, b) => b.deliveredCount - a.deliveredCount)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        recipients: c.totalRecipients,
        delivered: c.deliveredCount,
        deliveryRate:
          c.sentCount > 0
            ? Math.round((c.deliveredCount / c.sentCount) * 100)
            : 0,
      }));

    // Campaign status distribution
    const campaignsByStatus = campaigns.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      data: {
        summary: {
          totalCampaigns,
          activeCampaigns,
          completedCampaigns,
          totalSent,
          totalDelivered,
          totalFailed,
          deliveryRate,
          creditsAvailable: creditUsage.currentBalance + creditUsage.monthlyRemaining,
          creditsUsed: creditUsage.totalUsed,
          monthlyAllocation: creditUsage.monthlyAllocation,
          monthlyUsed: creditUsage.monthlyUsed,
        },
        charts: {
          byStatus: Object.entries(byStatus).map(([status, count]) => ({
            name: status,
            value: count,
          })),
          byDay: dailyStats,
          campaignsByStatus: Object.entries(campaignsByStatus).map(
            ([status, count]) => ({
              name: status.replace("_", " "),
              value: count,
            })
          ),
        },
        topCampaigns,
      },
    });
  } catch (error: any) {
    console.error("Error fetching SMS analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS analytics" },
      { status: 500 }
    );
  }
}
