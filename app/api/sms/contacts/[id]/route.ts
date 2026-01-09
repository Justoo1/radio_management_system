import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { validatePhoneNumber } from "@/lib/integrations/arkesel";

/**
 * GET /api/sms/contacts/[id]
 * Get a single SMS contact
 */
export async function GET(
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

    const { id } = await params;

    const contact = await prisma.sMSContact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ data: contact });
  } catch (error: any) {
    console.error("Error fetching SMS contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS contact" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sms/contacts/[id]
 * Update an SMS contact
 */
export async function PATCH(
  request: NextRequest,
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

    const { id } = await params;

    // Check contact exists and belongs to organization
    const existingContact = await prisma.sMSContact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phoneNumber, name, email, category, tags, notes, status } = body;

    // Build update data
    const updateData: any = {};

    if (phoneNumber !== undefined) {
      const validatedPhone = validatePhoneNumber(phoneNumber);
      if (!validatedPhone) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 }
        );
      }

      // Check for duplicate if phone changed
      if (validatedPhone !== existingContact.phoneNumber) {
        const duplicate = await prisma.sMSContact.findUnique({
          where: {
            organizationId_phoneNumber: {
              organizationId,
              phoneNumber: validatedPhone,
            },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: "A contact with this phone number already exists" },
            { status: 409 }
          );
        }
      }

      updateData.phoneNumber = validatedPhone;
    }

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;

    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    }

    if (status !== undefined) {
      if (!["ACTIVE", "OPTED_OUT", "INVALID", "BOUNCED"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set optedOutAt if opting out
      if (status === "OPTED_OUT" && existingContact.status !== "OPTED_OUT") {
        updateData.optedOutAt = new Date();
      }
    }

    const contact = await prisma.sMSContact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: contact,
      message: "Contact updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating SMS contact:", error);
    return NextResponse.json(
      { error: "Failed to update SMS contact" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sms/contacts/[id]
 * Delete an SMS contact
 */
export async function DELETE(
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

    await prisma.sMSContact.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting SMS contact:", error);
    return NextResponse.json(
      { error: "Failed to delete SMS contact" },
      { status: 500 }
    );
  }
}
