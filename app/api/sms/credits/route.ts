import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasFeature } from "@/lib/subscription-access";
import { prisma } from "@/lib/prisma";
import {
  getCreditUsage,
  addCredits,
  setMonthlyAllocation,
} from "@/lib/services/sms-credits";

/**
 * GET /api/sms/credits
 * Get SMS credit balance and usage for the organization
 */
export async function GET() {
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

    // Check if SMS feature is enabled
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

    const usage = await getCreditUsage(organizationId);

    return NextResponse.json({
      data: {
        balance: usage.currentBalance,
        monthlyAllocation: usage.monthlyAllocation,
        monthlyUsed: usage.monthlyUsed,
        monthlyRemaining: usage.monthlyRemaining,
        totalAvailable: usage.currentBalance + usage.monthlyRemaining,
        totalPurchased: usage.totalPurchased,
        totalUsed: usage.totalUsed,
        lastPurchase: usage.lastPurchaseDate
          ? {
              date: usage.lastPurchaseDate,
              amount: usage.lastPurchaseAmount,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching SMS credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS credits" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sms/credits
 * Add credits or set monthly allocation (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners/admins can add credits
    if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Only owners and admins can manage credits" },
        { status: 403 }
      );
    }

    const organizationId = session.user.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, amount, cost } = body;

    if (!action || !["add_credits", "set_allocation"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'add_credits' or 'set_allocation'" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a non-negative number" },
        { status: 400 }
      );
    }

    if (action === "add_credits") {
      const result = await addCredits(organizationId, amount, cost);
      return NextResponse.json({
        data: result,
        message: `Successfully added ${amount} SMS credits`,
      });
    }

    if (action === "set_allocation") {
      await setMonthlyAllocation(organizationId, amount);
      const usage = await getCreditUsage(organizationId);
      return NextResponse.json({
        data: usage,
        message: `Monthly allocation set to ${amount} credits`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error managing SMS credits:", error);
    return NextResponse.json(
      { error: "Failed to manage SMS credits" },
      { status: 500 }
    );
  }
}
