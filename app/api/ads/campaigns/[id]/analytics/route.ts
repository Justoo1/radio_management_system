import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/ads/campaigns/[id]/analytics - Get campaign analytics
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

    const { id: campaignId } = await params;

    // Get campaign
    const campaign = await prisma.adCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        targetPlays: true,
        completedPlays: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get all play history for this campaign
    const playHistory = await prisma.adPlayHistory.findMany({
      where: {
        advertisement: {
          campaignId,
        },
      },
      select: {
        id: true,
        playedAt: true,
        playDuration: true,
        playStatus: true,
        daypartName: true,
        timeOfDay: true,
        dayOfWeek: true,
        programId: true,
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        playedAt: "asc",
      },
    });

    // Calculate analytics
    // 1. Play distribution by status
    const statusCounts = playHistory.reduce((acc, play) => {
      acc[play.playStatus] = (acc[play.playStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 2. Play distribution by daypart
    const daypartCounts = playHistory.reduce((acc, play) => {
      const daypart = play.daypartName || "Unspecified";
      acc[daypart] = (acc[daypart] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 3. Play distribution by day of week
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeekCounts = playHistory.reduce((acc, play) => {
      if (play.dayOfWeek !== null) {
        const dayName = dayNames[play.dayOfWeek];
        acc[dayName] = (acc[dayName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 4. Play distribution by hour
    const hourCounts = playHistory.reduce((acc, play) => {
      if (play.timeOfDay) {
        const hour = play.timeOfDay.split(":")[0];
        const hourLabel = `${hour}:00`;
        acc[hourLabel] = (acc[hourLabel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 5. Play distribution by program
    const programCounts = playHistory.reduce((acc, play) => {
      if (play.program) {
        acc[play.program.name] = (acc[play.program.name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // 6. Daily play counts for timeline chart
    const dailyCounts = playHistory.reduce((acc, play) => {
      const date = new Date(play.playedAt).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to sorted arrays for charts
    const dailyTimeline = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Calculate cumulative for fulfillment timeline
    let cumulative = 0;
    const cumulativeTimeline = dailyTimeline.map(({ date, count }) => {
      cumulative += count;
      return {
        date,
        count,
        cumulative,
        targetPercent: campaign.targetPlays ? (cumulative / campaign.targetPlays) * 100 : null,
      };
    });

    // 7. Total play duration
    const totalDuration = playHistory.reduce((sum, play) => sum + (play.playDuration || 0), 0);
    const avgDuration = playHistory.length > 0 ? totalDuration / playHistory.length : 0;

    // 8. Completion rate
    const completedPlays = playHistory.filter((p) => p.playStatus === "COMPLETED").length;
    const completionRate = playHistory.length > 0 ? (completedPlays / playHistory.length) * 100 : 0;

    // Format for chart consumption
    const chartData = {
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      })),
      byDaypart: Object.entries(daypartCounts).map(([daypart, count]) => ({
        name: daypart,
        value: count,
      })),
      byDayOfWeek: dayNames.map((day) => ({
        name: day.substring(0, 3),
        value: dayOfWeekCounts[day] || 0,
      })),
      byHour: Array.from({ length: 24 }, (_, i) => {
        const hourLabel = `${i.toString().padStart(2, "0")}:00`;
        return {
          hour: hourLabel,
          value: hourCounts[hourLabel] || 0,
        };
      }),
      byProgram: Object.entries(programCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([program, count]) => ({
          name: program,
          value: count,
        })),
      timeline: cumulativeTimeline,
    };

    return NextResponse.json({
      data: {
        summary: {
          totalPlays: playHistory.length,
          completedPlays,
          targetPlays: campaign.targetPlays,
          fulfillmentRate: campaign.targetPlays
            ? (completedPlays / campaign.targetPlays) * 100
            : null,
          completionRate: Math.round(completionRate * 100) / 100,
          totalDuration,
          avgDuration: Math.round(avgDuration * 100) / 100,
          campaignDays: Math.ceil(
            (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          daysElapsed: Math.ceil(
            (Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
        distribution: {
          byStatus: statusCounts,
          byDaypart: daypartCounts,
          byDayOfWeek: dayOfWeekCounts,
          byHour: hourCounts,
          byProgram: programCounts,
        },
        chartData,
      },
    });
  } catch (error: any) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign analytics" },
      { status: 500 }
    );
  }
}
