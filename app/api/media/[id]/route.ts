import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMediaFileSchema } from "@/lib/validations/media.validation";
import { hasFeature } from "@/lib/subscription-access";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });

// GET /api/media/[id] - Get single media file
export async function GET(
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

    const { id } = await params;

    const mediaFile = await prisma.mediaFile.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mediaFile) {
      return NextResponse.json(
        { error: "Media file not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: mediaFile });
  } catch (error: any) {
    console.error("Error fetching media file:", error);
    return NextResponse.json(
      { error: "Failed to fetch media file" },
      { status: 500 }
    );
  }
}

// PATCH /api/media/[id] - Update media file metadata
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

    const { id } = await params;

    // Verify media file belongs to organization
    const existingFile = await prisma.mediaFile.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: "Media file not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateMediaFileSchema.parse(body);

    // Convert tags array to JSON string if provided
    const updateData: any = {
      ...validated,
      updatedAt: new Date(),
    };

    if (validated.tags) {
      updateData.tags = JSON.stringify(validated.tags);
    }

    // Update media file
    const updatedFile = await prisma.mediaFile.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: updatedFile,
      message: "Media file updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating media file:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update media file" },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - Delete media file
export async function DELETE(
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

    const { id } = await params;

    // Verify media file belongs to organization
    const existingFile = await prisma.mediaFile.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingFile) {
      return NextResponse.json(
        { error: "Media file not found" },
        { status: 404 }
      );
    }

    // Extract file key from URL for deletion from UploadThing
    // URL format: https://utfs.io/f/{fileKey}
    const fileKey = existingFile.url.split("/f/")[1];

    // Delete from UploadThing storage
    if (fileKey) {
      try {
        await utapi.deleteFiles(fileKey);
        console.log("File deleted from UploadThing:", fileKey);
      } catch (uploadError) {
        console.error("Error deleting from UploadThing:", uploadError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    await prisma.mediaFile.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Media file deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting media file:", error);
    return NextResponse.json(
      { error: "Failed to delete media file" },
      { status: 500 }
    );
  }
}
