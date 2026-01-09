import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/webhooks/arkesel
 * Webhook handler for Arkesel SMS delivery reports
 *
 * Expected payload from Arkesel:
 * {
 *   "message_id": "...",
 *   "recipient": "233XXXXXXXXX",
 *   "status": "DELIVERED" | "FAILED" | "REJECTED",
 *   "delivery_time": "2024-01-09T10:30:00Z",
 *   "error_code": "...",
 *   "error_message": "..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Arkesel webhook received:", JSON.stringify(body));

    // Handle both single and batch delivery reports
    const reports = Array.isArray(body) ? body : [body];

    let processed = 0;
    let failed = 0;

    for (const report of reports) {
      try {
        await processDeliveryReport(report);
        processed++;
      } catch (error) {
        console.error("Error processing delivery report:", error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
    });
  } catch (error: any) {
    console.error("Error handling Arkesel webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * Process a single delivery report from Arkesel
 */
async function processDeliveryReport(report: any) {
  const {
    message_id,
    recipient,
    status,
    delivery_time,
    error_code,
    error_message,
  } = report;

  // Map Arkesel status to our status
  const statusMap: Record<string, "DELIVERED" | "FAILED" | "REJECTED"> = {
    DELIVERED: "DELIVERED",
    DELIVRD: "DELIVERED",
    SENT: "DELIVERED", // Treat as delivered if Arkesel says sent
    FAILED: "FAILED",
    UNDELIVRD: "FAILED",
    REJECTED: "REJECTED",
    EXPIRED: "FAILED",
    UNKNOWN: "FAILED",
  };

  const mappedStatus = statusMap[status?.toUpperCase()] || "FAILED";

  // Find the message by gateway message ID or recipient
  let message;

  if (message_id) {
    message = await prisma.sMSMessage.findFirst({
      where: { gatewayMessageId: message_id },
    });
  }

  // If not found by ID, try by recipient (less reliable)
  if (!message && recipient) {
    message = await prisma.sMSMessage.findFirst({
      where: {
        recipient: recipient,
        status: "SENT",
      },
      orderBy: { sentAt: "desc" },
    });
  }

  if (!message) {
    console.warn(
      `No message found for delivery report: message_id=${message_id}, recipient=${recipient}`
    );
    return;
  }

  // Update message status
  const updateData: any = {
    status: mappedStatus,
    gatewayResponse: JSON.stringify(report),
  };

  if (mappedStatus === "DELIVERED") {
    updateData.deliveredAt = delivery_time
      ? new Date(delivery_time)
      : new Date();
  } else if (mappedStatus === "FAILED" || mappedStatus === "REJECTED") {
    updateData.errorMessage =
      error_message || error_code || `Delivery failed: ${status}`;
  }

  await prisma.sMSMessage.update({
    where: { id: message.id },
    data: updateData,
  });

  // Update campaign delivered/failed count
  if (message.campaignId) {
    if (mappedStatus === "DELIVERED") {
      await prisma.sMSCampaign.update({
        where: { id: message.campaignId },
        data: {
          deliveredCount: { increment: 1 },
        },
      });
    } else if (mappedStatus === "FAILED" || mappedStatus === "REJECTED") {
      // Only increment failed count if not already counted
      if (message.status !== "FAILED") {
        await prisma.sMSCampaign.update({
          where: { id: message.campaignId },
          data: {
            failedCount: { increment: 1 },
          },
        });
      }
    }

    // Check if campaign should be marked as completed
    await checkCampaignCompletion(message.campaignId);
  }
}

/**
 * Check if campaign is fully delivered and update status
 */
async function checkCampaignCompletion(campaignId: string) {
  const campaign = await prisma.sMSCampaign.findUnique({
    where: { id: campaignId },
    select: {
      status: true,
      totalRecipients: true,
    },
  });

  if (!campaign || campaign.status === "COMPLETED") {
    return;
  }

  // Count messages by status
  const [delivered, failed, pending] = await Promise.all([
    prisma.sMSMessage.count({
      where: { campaignId, status: "DELIVERED" },
    }),
    prisma.sMSMessage.count({
      where: {
        campaignId,
        status: { in: ["FAILED", "REJECTED"] },
      },
    }),
    prisma.sMSMessage.count({
      where: {
        campaignId,
        status: { in: ["PENDING", "QUEUED", "SENT"] },
      },
    }),
  ]);

  // If no more pending messages, mark as completed
  if (pending === 0) {
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

// Also handle GET for webhook verification if needed
export async function GET(request: NextRequest) {
  // Some webhook providers require verification
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    return new NextResponse(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}
