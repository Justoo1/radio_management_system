import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import {
  djAccountUpdateSchema,
  djAccountPasswordSchema,
} from "@/lib/validations/streaming.validation";
import bcrypt from "bcryptjs";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/streaming/dj-accounts/[id] - Get single DJ account
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    const djAccount = await prisma.streamDJAccount.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!djAccount) {
      return NextResponse.json({ error: "DJ account not found" }, { status: 404 });
    }

    return NextResponse.json({ data: djAccount });
  } catch (error) {
    console.error("Error fetching DJ account:", error);
    return NextResponse.json(
      { error: "Failed to fetch DJ account" },
      { status: 500 }
    );
  }
}

// PATCH /api/streaming/dj-accounts/[id] - Update DJ account
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const logUserId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "update")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get DJ account with streaming config
    const djAccount = await prisma.streamDJAccount.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
      include: {
        streamingConfig: true,
      },
    });

    if (!djAccount) {
      return NextResponse.json({ error: "DJ account not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = djAccountUpdateSchema.parse(body);

    // Update in AzuraCast if connected
    if (djAccount.streamingConfig.azuracastStationId && djAccount.azuracastStreamerId) {
      try {
        const azuracastService = createAzuraCastService();

        const updateData: Partial<{ displayName: string; isActive: boolean; password: string }> = {};
        if (validatedData.displayName) updateData.displayName = validatedData.displayName;
        if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

        // Handle password update separately if provided
        if (body.password) {
          const { password } = djAccountPasswordSchema.parse(body);
          updateData.password = password;
        }

        await azuracastService.updateStreamer(
          djAccount.streamingConfig.azuracastStationId,
          djAccount.azuracastStreamerId,
          updateData
        );
      } catch (azuraError) {
        console.error("AzuraCast streamer update failed:", azuraError);
      }
    }

    // Prepare update data for database
    const dbUpdateData: {
      displayName?: string;
      userId?: string;
      isActive?: boolean;
      password?: string;
    } = {};

    if (validatedData.displayName) dbUpdateData.displayName = validatedData.displayName;
    if (validatedData.userId) dbUpdateData.userId = validatedData.userId;
    if (validatedData.isActive !== undefined) dbUpdateData.isActive = validatedData.isActive;

    // Hash password if provided
    if (body.password) {
      const { password } = djAccountPasswordSchema.parse(body);
      dbUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Update in database
    const updatedAccount = await prisma.streamDJAccount.update({
      where: { id },
      data: dbUpdateData,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: logUserId,
        action: "UPDATE",
        resource: "stream_dj_account",
        resourceId: id,
        description: `Updated DJ account: ${validatedData.displayName || djAccount.displayName}`,
      },
    });

    return NextResponse.json({ data: updatedAccount });
  } catch (error) {
    console.error("Error updating DJ account:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update DJ account" },
      { status: 500 }
    );
  }
}

// DELETE /api/streaming/dj-accounts/[id] - Delete DJ account
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const logUserId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "delete")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get DJ account with streaming config
    const djAccount = await prisma.streamDJAccount.findFirst({
      where: {
        id,
        streamingConfig: { organizationId },
      },
      include: {
        streamingConfig: true,
      },
    });

    if (!djAccount) {
      return NextResponse.json({ error: "DJ account not found" }, { status: 404 });
    }

    // Delete from AzuraCast if connected
    if (djAccount.streamingConfig.azuracastStationId && djAccount.azuracastStreamerId) {
      try {
        const azuracastService = createAzuraCastService();
        await azuracastService.deleteStreamer(
          djAccount.streamingConfig.azuracastStationId,
          djAccount.azuracastStreamerId
        );
      } catch (azuraError) {
        console.error("AzuraCast streamer deletion failed:", azuraError);
      }
    }

    // Delete from database
    await prisma.streamDJAccount.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        userId: logUserId,
        action: "DELETE",
        resource: "stream_dj_account",
        resourceId: id,
        description: `Deleted DJ account: ${djAccount.displayName}`,
      },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting DJ account:", error);
    return NextResponse.json(
      { error: "Failed to delete DJ account" },
      { status: 500 }
    );
  }
}
