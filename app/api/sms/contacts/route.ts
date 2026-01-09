import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { validatePhoneNumber } from "@/lib/integrations/arkesel";

/**
 * GET /api/sms/contacts
 * List SMS contacts for organization with pagination, search, and filters
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [contacts, total] = await Promise.all([
      prisma.sMSContact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.sMSContact.count({ where }),
    ]);

    return NextResponse.json({
      data: contacts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching SMS contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS contacts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sms/contacts
 * Create a new SMS contact
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { phoneNumber, name, email, category, tags, notes } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const validatedPhone = validatePhoneNumber(phoneNumber);
    if (!validatedPhone) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use Ghana format: 0XXXXXXXXX or 233XXXXXXXXX" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.sMSContact.findUnique({
      where: {
        organizationId_phoneNumber: {
          organizationId,
          phoneNumber: validatedPhone,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A contact with this phone number already exists" },
        { status: 409 }
      );
    }

    const contact = await prisma.sMSContact.create({
      data: {
        organizationId,
        phoneNumber: validatedPhone,
        name,
        email,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        notes,
        source: "MANUAL",
      },
    });

    return NextResponse.json({
      data: contact,
      message: "Contact created successfully",
    });
  } catch (error: any) {
    console.error("Error creating SMS contact:", error);
    return NextResponse.json(
      { error: "Failed to create SMS contact" },
      { status: 500 }
    );
  }
}
