import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription-access";
import { validatePhoneNumber } from "@/lib/integrations/arkesel";

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
}

/**
 * POST /api/sms/contacts/import
 * Import contacts from CSV data
 *
 * Expected body:
 * {
 *   contacts: [{ phoneNumber, name?, email?, category? }],
 *   updateExisting?: boolean,
 *   defaultCategory?: string
 * }
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
    const { contacts, updateExisting = false, defaultCategory } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    // Limit import size
    if (contacts.length > 5000) {
      return NextResponse.json(
        { error: "Maximum 5000 contacts per import" },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      total: contacts.length,
      imported: 0,
      duplicates: 0,
      invalid: 0,
      errors: [],
    };

    // Get existing phone numbers for duplicate checking
    const existingContacts = await prisma.sMSContact.findMany({
      where: { organizationId },
      select: { id: true, phoneNumber: true },
    });

    const existingPhones = new Map(
      existingContacts.map((c) => [c.phoneNumber, c.id])
    );

    const toCreate: any[] = [];
    const toUpdate: any[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const rowNum = i + 1;

      // Validate phone number
      if (!contact.phoneNumber) {
        result.invalid++;
        result.errors.push(`Row ${rowNum}: Missing phone number`);
        continue;
      }

      const validatedPhone = validatePhoneNumber(contact.phoneNumber);
      if (!validatedPhone) {
        result.invalid++;
        result.errors.push(`Row ${rowNum}: Invalid phone number "${contact.phoneNumber}"`);
        continue;
      }

      // Check if phone already exists
      const existingId = existingPhones.get(validatedPhone);

      if (existingId) {
        if (updateExisting) {
          toUpdate.push({
            id: existingId,
            data: {
              name: contact.name || undefined,
              email: contact.email || undefined,
              category: contact.category || defaultCategory || undefined,
            },
          });
        } else {
          result.duplicates++;
        }
        continue;
      }

      // Add to create list
      toCreate.push({
        organizationId,
        phoneNumber: validatedPhone,
        name: contact.name || null,
        email: contact.email || null,
        category: contact.category || defaultCategory || null,
        source: "IMPORT",
      });

      // Track for duplicate detection within batch
      existingPhones.set(validatedPhone, "pending");
    }

    // Batch create new contacts
    if (toCreate.length > 0) {
      await prisma.sMSContact.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      result.imported = toCreate.length;
    }

    // Update existing contacts if requested
    if (updateExisting && toUpdate.length > 0) {
      for (const update of toUpdate) {
        await prisma.sMSContact.update({
          where: { id: update.id },
          data: update.data,
        });
      }
      result.imported += toUpdate.length;
    }

    // Limit error messages shown
    if (result.errors.length > 10) {
      const remaining = result.errors.length - 10;
      result.errors = result.errors.slice(0, 10);
      result.errors.push(`... and ${remaining} more errors`);
    }

    return NextResponse.json({
      data: result,
      message: `Imported ${result.imported} contacts. ${result.duplicates} duplicates, ${result.invalid} invalid.`,
    });
  } catch (error: any) {
    console.error("Error importing SMS contacts:", error);
    return NextResponse.json(
      { error: "Failed to import SMS contacts" },
      { status: 500 }
    );
  }
}
