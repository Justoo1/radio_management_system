import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron/sms/check-delivery
 * Cron job to check and update delivery status for messages
 * Acts as a fallback for missed webhooks
 * Should be called every 5 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting SMS delivery check cron job...");

    // Find messages that have been SENT for more than 5 minutes
    // and don't have a delivery status yet
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const staleMessages = await prisma.sMSMessage.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: fiveMinutesAgo },
      },
      take: 100, // Process 100 at a time
      include: {
        campaign: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (staleMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale messages to check",
        processed: 0,
      });
    }

    // For now, we'll mark very old SENT messages as DELIVERED
    // In a production system, you would poll Arkesel's API for status
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    let assumedDelivered = 0;
    const campaignUpdates = new Map<string, { delivered: number }>();

    for (const message of staleMessages) {
      // If sent more than an hour ago without webhook response,
      // assume delivered (common for Ghana networks)
      if (message.sentAt && message.sentAt < oneHourAgo) {
        await prisma.sMSMessage.update({
          where: { id: message.id },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            gatewayResponse: JSON.stringify({
              note: "Assumed delivered after 1 hour",
              assumedAt: new Date().toISOString(),
            }),
          },
        });

        assumedDelivered++;

        // Track campaign updates
        if (message.campaignId) {
          const current = campaignUpdates.get(message.campaignId) || {
            delivered: 0,
          };
          current.delivered++;
          campaignUpdates.set(message.campaignId, current);
        }
      }
    }

    // Update campaign delivered counts
    for (const [campaignId, updates] of campaignUpdates) {
      await prisma.sMSCampaign.update({
        where: { id: campaignId },
        data: {
          deliveredCount: { increment: updates.delivered },
        },
      });

      // Check if campaign is complete
      await checkCampaignCompletion(campaignId);
    }

    console.log(
      `SMS delivery check complete. Assumed delivered: ${assumedDelivered}`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${staleMessages.length} stale messages`,
      assumedDelivered,
      campaignsUpdated: campaignUpdates.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error checking SMS delivery:", error);
    return NextResponse.json(
      { error: "Failed to check SMS delivery", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if campaign is complete and update status
 */
async function checkCampaignCompletion(campaignId: string) {
  const pendingCount = await prisma.sMSMessage.count({
    where: {
      campaignId,
      status: { in: ["PENDING", "QUEUED", "SENT"] },
    },
  });

  if (pendingCount === 0) {
    const [delivered, failed] = await Promise.all([
      prisma.sMSMessage.count({
        where: { campaignId, status: "DELIVERED" },
      }),
      prisma.sMSMessage.count({
        where: {
          campaignId,
          status: { in: ["FAILED", "REJECTED"] },
        },
      }),
    ]);

    await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: {
        status: "COMPLETED",
        deliveredCount: delivered,
        failedCount: failed,
        completedAt: new Date(),
      },
    });
  }
}

// Also allow GET for easier cron service integration
export async function GET(request: NextRequest) {
  return POST(request);
}
