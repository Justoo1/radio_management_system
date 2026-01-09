import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";

/**
 * POST /api/sms/contacts/[id]/opt-out
 * Opt-out a contact from receiving SMS
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

    const { id } = await params;

    // Check contact exists and belongs to organization
    const contact = await prisma.sMSContact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (contact.status === "OPTED_OUT") {
      return NextResponse.json(
        { error: "Contact is already opted out" },
        { status: 400 }
      );
    }

    const updated = await prisma.sMSContact.update({
      where: { id },
      data: {
        status: "OPTED_OUT",
        optedOutAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updated,
      message: "Contact opted out successfully",
    });
  } catch (error: any) {
    console.error("Error opting out contact:", error);
    return NextResponse.json(
      { error: "Failed to opt out contact" },
      { status: 500 }
    );
  }
}
