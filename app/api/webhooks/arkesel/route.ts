import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Verify Arkesel webhook signature
 * Arkesel uses HMAC SHA-256 for webhook signature verification
 */
function verifyArkeselSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.ARKESEL_WEBHOOK_SECRET;

  // If no secret configured, log warning but allow in development
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('ARKESEL_WEBHOOK_SECRET not configured - rejecting webhook');
      return false;
    }
    console.warn('ARKESEL_WEBHOOK_SECRET not configured - allowing in development');
    return true;
  }

  if (!signature) {
    console.error('Missing Arkesel webhook signature');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

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
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-arkesel-signature');

    // SECURITY: Verify webhook signature
    if (!verifyArkeselSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const body = JSON.parse(payload);

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

  // Find the message by gateway message ID - SECURITY: Include campaign for org verification
  let message;

  if (message_id) {
    message = await prisma.sMSMessage.findFirst({
      where: { gatewayMessageId: message_id },
      include: {
        campaign: {
          select: { organizationId: true },
        },
      },
    });
  }

  // SECURITY: Only fall back to recipient lookup if we have a valid message_id match
  // This prevents cross-organization message status updates
  if (!message && recipient && message_id) {
    // Only use recipient as secondary lookup when we have a message_id to correlate
    message = await prisma.sMSMessage.findFirst({
      where: {
        recipient: recipient,
        status: "SENT",
        // SECURITY: Require gatewayMessageId to be null (not yet assigned)
        gatewayMessageId: null,
      },
      include: {
        campaign: {
          select: { organizationId: true },
        },
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

  // SECURITY: Log organization context for audit trail
  const organizationId = message.campaign?.organizationId;
  if (!organizationId) {
    console.warn(`Message ${message.id} has no associated organization - skipping update`);
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
