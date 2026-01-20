import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  deleteOrganizationWithData,
  getOrganizationDataSummary,
} from "@/lib/utils/delete-organization";
import { prisma } from "@/lib/prisma";

/**
 * Verify developer access token (consistent with other admin endpoints)
 */
async function verifyDeveloperAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const devAccessToken = cookieStore.get('dev_access_token');
  return !!(devAccessToken && devAccessToken.value);
}

/**
 * GET /api/admin/organizations/[id]/delete?preview=true
 * Preview what will be deleted (data summary)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Use dev_access_token cookie (consistent with other admin endpoints)
    const hasAccess = await verifyDeveloperAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized - Developer access required" },
        { status: 401 }
      );
    }

    const { id: organizationId } = await params;

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get data summary
    const summary = await getOrganizationDataSummary(organizationId);

    return NextResponse.json({
      organization,
      summary,
      warning:
        "This action cannot be undone. All data will be permanently deleted.",
    });
  } catch (error) {
    console.error("Error previewing organization deletion:", error);
    return NextResponse.json(
      { error: "Failed to preview deletion" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/organizations/[id]/delete
 * Actually delete the organization and all its data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SECURITY: Use dev_access_token cookie (consistent with other admin endpoints)
    const hasAccess = await verifyDeveloperAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized - Developer access required" },
        { status: 401 }
      );
    }

    const { id: organizationId } = await params;

    // Get confirmation from request body
    const body = await request.json();
    const { confirmationName } = body;

    // Get organization name for confirmation
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Require confirmation by typing organization name
    if (confirmationName !== organization.name) {
      return NextResponse.json(
        {
          error: "Confirmation failed",
          message: "Organization name does not match",
        },
        { status: 400 }
      );
    }

    // Perform deletion
    const result = await deleteOrganizationWithData(organizationId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      {
        error: "Failed to delete organization",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
