import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { checkBalance } from "@/lib/services/sms-credits";
import { validatePhoneNumber } from "@/lib/integrations/arkesel";

/**
 * POST /api/sms/campaigns/[id]/send
 * Initiate sending an SMS campaign
 */
export async function POST(
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

    const { id: campaignId } = await params;

    // Get campaign
    const campaign = await prisma.sMSCampaign.findFirst({
      where: {
        id: campaignId,
        organizationId,
      },
      include: {
        template: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Validate campaign status
    if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: `Cannot send campaign with status: ${campaign.status}` },
        { status: 400 }
      );
    }

    // Get recipients based on type
    const recipients = await getRecipients(organizationId, campaign);

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients found for this campaign" },
        { status: 400 }
      );
    }

    // Check SMS credit balance
    const creditCheck = await checkBalance(organizationId, recipients.length);

    if (!creditCheck.sufficient) {
      return NextResponse.json(
        {
          error: `Insufficient SMS credits. Required: ${recipients.length}, Available: ${creditCheck.available}`,
        },
        { status: 400 }
      );
    }

    // Create SMS message records for each recipient
    const messages = recipients.map((recipient) => ({
      campaignId,
      recipient: recipient.phoneNumber,
      recipientName: recipient.name,
      message: campaign.messageContent,
      status: "PENDING" as const,
    }));

    await prisma.sMSMessage.createMany({
      data: messages,
    });

    // Update campaign status to PROCESSING
    const updated = await prisma.sMSCampaign.update({
      where: { id: campaignId },
      data: {
        status: "PROCESSING",
        totalRecipients: recipients.length,
        sentAt: new Date(),
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json({
      data: updated,
      message: `Campaign processing started. Sending to ${recipients.length} recipients.`,
      recipientCount: recipients.length,
      estimatedCredits: recipients.length,
    });
  } catch (error: any) {
    console.error("Error sending SMS campaign:", error);
    return NextResponse.json(
      { error: "Failed to send SMS campaign" },
      { status: 500 }
    );
  }
}

/**
 * Get recipients for a campaign based on recipient type
 */
async function getRecipients(
  organizationId: string,
  campaign: any
): Promise<{ phoneNumber: string; name: string | null }[]> {
  const recipients: { phoneNumber: string; name: string | null }[] = [];

  switch (campaign.recipientType) {
    case "ALL": {
      // Get all active SMS contacts
      const contacts = await prisma.sMSContact.findMany({
        where: {
          organizationId,
          status: "ACTIVE",
        },
        select: { phoneNumber: true, name: true },
      });
      recipients.push(...contacts);
      break;
    }

    case "CATEGORY": {
      // Get contacts by category
      if (campaign.recipientFilter) {
        const filter = JSON.parse(campaign.recipientFilter);
        const contacts = await prisma.sMSContact.findMany({
          where: {
            organizationId,
            status: "ACTIVE",
            category: filter.category,
          },
          select: { phoneNumber: true, name: true },
        });
        recipients.push(...contacts);
      }
      break;
    }

    case "CUSTOM": {
      // Custom phone numbers from filter
      if (campaign.recipientFilter) {
        const filter = JSON.parse(campaign.recipientFilter);
        const phoneNumbers = filter.phoneNumbers || [];

        for (const phone of phoneNumbers) {
          const validated = validatePhoneNumber(phone);
          if (validated) {
            // Check if in contacts for name lookup
            const contact = await prisma.sMSContact.findUnique({
              where: {
                organizationId_phoneNumber: {
                  organizationId,
                  phoneNumber: validated,
                },
              },
              select: { name: true },
            });

            recipients.push({
              phoneNumber: validated,
              name: contact?.name || null,
            });
          }
        }
      }
      break;
    }

    case "IMPORTED": {
      // This type uses contacts imported specifically for the campaign
      // For now, treat as CUSTOM with phone numbers
      if (campaign.recipientFilter) {
        const filter = JSON.parse(campaign.recipientFilter);
        const phoneNumbers = filter.phoneNumbers || [];

        for (const phone of phoneNumbers) {
          const validated = validatePhoneNumber(phone);
          if (validated) {
            recipients.push({
              phoneNumber: validated,
              name: null,
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  // Remove duplicates
  const seen = new Set<string>();
  return recipients.filter((r) => {
    if (seen.has(r.phoneNumber)) return false;
    seen.add(r.phoneNumber);
    return true;
  });
}
