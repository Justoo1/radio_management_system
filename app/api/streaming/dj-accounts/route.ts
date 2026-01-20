import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { createAzuraCastService } from "@/lib/services/azuracast.service";
import {
  djAccountCreateSchema,
  djAccountPasswordSchema,
} from "@/lib/validations/streaming.validation";
import bcrypt from "bcryptjs";
import { Feature, checkFeatureAccess } from "@/lib/features";

// GET /api/streaming/dj-accounts - List DJ accounts
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Check streaming feature access
    const { hasAccess } = await checkFeatureAccess(prisma, organizationId, Feature.STREAMING);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Streaming feature is not enabled for your organization. Please upgrade your plan." },
        { status: 403 }
      );
    }

    // Get streaming config with DJ accounts
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
      include: {
        djAccounts: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { displayName: "asc" },
        },
      },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: streamingConfig.djAccounts });
  } catch (error) {
    console.error("Error fetching DJ accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch DJ accounts" },
      { status: 500 }
    );
  }
}

// POST /api/streaming/dj-accounts - Create DJ account
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const logUserId = session.user.id;

    // Check permission
    if (!hasPermission(session.user, "streaming", "create")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Get streaming config
    const streamingConfig = await prisma.streamingConfig.findUnique({
      where: { organizationId },
    });

    if (!streamingConfig) {
      return NextResponse.json(
        { error: "Streaming not configured" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = djAccountCreateSchema.parse(body);
    const { password } = djAccountPasswordSchema.parse(body);

    // Check for duplicate username
    const existingAccount = await prisma.streamDJAccount.findFirst({
      where: {
        streamingConfigId: streamingConfig.id,
        username: validatedData.username,
      },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    let azuracastStreamerId: number | null = null;

    // Create in AzuraCast if connected
    if (streamingConfig.azuracastStationId) {
      try {
        const azuracastService = createAzuraCastService();
        const streamer = await azuracastService.createStreamer(
          streamingConfig.azuracastStationId,
          {
            username: validatedData.username,
            password: password,
            displayName: validatedData.displayName,
            isActive: true,
          }
        );
        azuracastStreamerId = streamer.id;
      } catch (azuraError) {
        console.error("AzuraCast streamer creation failed:", azuraError);
        // Continue without AzuraCast
      }
    }

    // Hash the password for local storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create in database
    const djAccount = await prisma.streamDJAccount.create({
      data: {
        streamingConfigId: streamingConfig.id,
        azuracastStreamerId,
        displayName: validatedData.displayName,
        username: validatedData.username,
        password: hashedPassword,
        userId: validatedData.userId,
        isActive: true,
      },
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
        action: "CREATE",
        resource: "stream_dj_account",
        resourceId: djAccount.id,
        description: `Created DJ account: ${validatedData.displayName}`,
      },
    });

    return NextResponse.json({ data: djAccount }, { status: 201 });
  } catch (error) {
    console.error("Error creating DJ account:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create DJ account" },
      { status: 500 }
    );
  }
}
