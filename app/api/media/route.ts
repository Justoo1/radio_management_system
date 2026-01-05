import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mediaFileFilterSchema } from "@/lib/validations/media.validation";
import { hasFeature } from "@/lib/subscription-access";

// GET /api/media - List media files with filters
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

    // Check if feature is enabled
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { enabledFeatures: true },
    });

    if (!hasFeature(organization, "media_library")) {
      return NextResponse.json(
        { error: "Media Library feature not enabled" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filterInput = {
      category: searchParams.get("category") || undefined,
      programId: searchParams.get("programId") || undefined,
      search: searchParams.get("search") || undefined,
      tags: searchParams.getAll("tags"),
      limit: parseInt(searchParams.get("limit") || "50"),
      offset: parseInt(searchParams.get("offset") || "0"),
    };

    const validated = mediaFileFilterSchema.parse(filterInput);

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (validated.category) {
      where.category = validated.category;
    }

    if (validated.programId) {
      where.programId = validated.programId;
    }

    if (validated.search) {
      where.OR = [
        { name: { contains: validated.search, mode: "insensitive" } },
        { tags: { contains: validated.search, mode: "insensitive" } },
      ];
    }

    if (validated.tags && validated.tags.length > 0) {
      // Tags is a JSON string field, search within it
      where.tags = { contains: validated.tags.join(","), mode: "insensitive" };
    }

    // Fetch media files
    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        take: validated.limit,
        skip: validated.offset,
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.mediaFile.count({ where }),
    ]);

    return NextResponse.json({
      data: mediaFiles,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error: any) {
    console.error("Error fetching media files:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid filter parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch media files" },
      { status: 500 }
    );
  }
}
