import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";

/**
 * GET /api/sms/contacts/categories
 * Get unique contact categories for organization
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

    // Get distinct categories with counts
    const categories = await prisma.sMSContact.groupBy({
      by: ["category"],
      where: {
        organizationId,
        category: { not: null },
      },
      _count: {
        id: true,
      },
    });

    // Get total contacts count
    const totalCount = await prisma.sMSContact.count({
      where: { organizationId },
    });

    // Get status distribution
    const statusCounts = await prisma.sMSContact.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      data: {
        categories: categories.map((c) => ({
          name: c.category || "Uncategorized",
          count: c._count.id,
        })),
        statusCounts: statusCounts.reduce(
          (acc, s) => {
            acc[s.status] = s._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        totalContacts: totalCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching contact categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact categories" },
      { status: 500 }
    );
  }
}
