import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBulkSMS } from "@/lib/integrations/arkesel";
import { deductCredits } from "@/lib/services/sms-credits";

const BATCH_SIZE = 50; // Process 50 messages per batch

/**
 * POST /api/cron/sms/process
 * Cron job to process pending SMS messages
 * Should be called every minute
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

    console.log("Starting SMS processing cron job...");

    // Find campaigns with PROCESSING status
    const campaigns = await prisma.sMSCampaign.findMany({
      where: {
        status: "PROCESSING",
      },
      select: {
        id: true,
        organizationId: true,
        messageContent: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No campaigns to process",
        processed: 0,
      });
    }

    let totalSent = 0;
    let totalFailed = 0;
    const processedCampaigns: string[] = [];

    for (const campaign of campaigns) {
      // Get pending messages for this campaign (batch)
      const pendingMessages = await prisma.sMSMessage.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING",
        },
        take: BATCH_SIZE,
        orderBy: { createdAt: "asc" },
      });

      if (pendingMessages.length === 0) {
        // All messages processed, check if campaign is complete
        await checkCampaignCompletion(campaign.id);
        continue;
      }

      // Extract phone numbers
      const recipients = pendingMessages.map((m) => m.recipient);

      // Send via Arkesel with organization name as sender ID
      const result = await sendBulkSMS({
        recipients,
        message: campaign.messageContent,
        organizationName: campaign.organization.name,
      });

      if (result.success) {
        // Update message statuses to SENT
        await prisma.sMSMessage.updateMany({
          where: {
            id: { in: pendingMessages.map((m) => m.id) },
          },
          data: {
            status: "SENT",
            sentAt: new Date(),
            gatewayMessageId: result.messageId,
          },
        });

        // Update campaign sent count
        await prisma.sMSCampaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: { increment: pendingMessages.length },
          },
        });

        // Deduct credits
        await deductCredits(
          campaign.organizationId,
          result.creditsUsed || pendingMessages.length
        );

        totalSent += pendingMessages.length;
      } else {
        // Mark messages as failed
        await prisma.sMSMessage.updateMany({
          where: {
            id: { in: pendingMessages.map((m) => m.id) },
          },
          data: {
            status: "FAILED",
            errorMessage: result.error,
          },
        });

        // Update campaign failed count
        await prisma.sMSCampaign.update({
          where: { id: campaign.id },
          data: {
            failedCount: { increment: pendingMessages.length },
          },
        });

        totalFailed += pendingMessages.length;
      }

      processedCampaigns.push(campaign.id);

      // Check if campaign is complete
      await checkCampaignCompletion(campaign.id);
    }

    console.log(
      `SMS processing complete. Sent: ${totalSent}, Failed: ${totalFailed}`
    );

    return NextResponse.json({
      success: true,
      message: `Processed ${totalSent + totalFailed} messages`,
      sent: totalSent,
      failed: totalFailed,
      campaignsProcessed: processedCampaigns.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error processing SMS messages:", error);
    return NextResponse.json(
      { error: "Failed to process SMS messages", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Check if a campaign has finished processing and update status
 */
async function checkCampaignCompletion(campaignId: string) {
  const pendingCount = await prisma.sMSMessage.count({
    where: {
      campaignId,
      status: "PENDING",
    },
  });

  if (pendingCount === 0) {
    // Get final counts
    const [sentCount, failedCount, deliveredCount] = await Promise.all([
      prisma.sMSMessage.count({
        where: { campaignId, status: "SENT" },
      }),
      prisma.sMSMessage.count({
        where: { campaignId, status: "FAILED" },
      }),
      prisma.sMSMessage.count({
        where: { campaignId, status: "DELIVERED" },
      }),
    ]);

    // Determine final status
    let finalStatus: "SENT" | "FAILED" | "PARTIALLY_SENT";
    if (failedCount === 0) {
      finalStatus = "SENT";
    } else if (sentCount === 0 && deliveredCount === 0) {
      finalStatus = "FAILED";
    } else {
      finalStatus = "PARTIALLY_SENT";
    }

    await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentCount,
        failedCount,
        deliveredCount,
        completedAt: new Date(),
      },
    });
  }
}

// Also allow GET for easier cron service integration
export async function GET(request: NextRequest) {
  return POST(request);
}
