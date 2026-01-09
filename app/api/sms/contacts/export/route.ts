import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { formatPhoneNumber } from "@/lib/integrations/arkesel";

/**
 * GET /api/sms/contacts/export
 * Export contacts as CSV
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
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const format = searchParams.get("format") || "csv";

    // Build where clause
    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const contacts = await prisma.sMSContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (format === "json") {
      return NextResponse.json({
        data: contacts,
        total: contacts.length,
      });
    }

    // Generate CSV
    const headers = [
      "Phone Number",
      "Name",
      "Email",
      "Category",
      "Status",
      "Opted Out At",
      "Source",
      "Created At",
    ];

    const rows = contacts.map((contact) => [
      formatPhoneNumber(contact.phoneNumber),
      contact.name || "",
      contact.email || "",
      contact.category || "",
      contact.status,
      contact.optedOutAt ? new Date(contact.optedOutAt).toISOString() : "",
      contact.source || "",
      new Date(contact.createdAt).toISOString(),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sms_contacts_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting SMS contacts:", error);
    return NextResponse.json(
      { error: "Failed to export SMS contacts" },
      { status: 500 }
    );
  }
}
