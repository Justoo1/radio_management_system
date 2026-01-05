import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  // Audio files for media library (jingles, ads, sound effects)
  audioUploader: f({
    audio: {
      maxFileSize: "32MB",
      maxFileCount: 10, // Allow bulk uploads
    },
  })
    .middleware(async ({ req }) => {
      // Authentication check
      const session = await auth();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized - Please log in");
      }

      const userId = session.user.id;
      const organizationId = session.user.organizationId;

      if (!organizationId) {
        throw new UploadThingError("No organization found");
      }

      // Fetch organization with feature checks
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          status: true,
          enabledFeatures: true,
          maxStorageGB: true,
        },
      });

      if (!organization) {
        throw new UploadThingError("Organization not found");
      }

      // Check organization status
      if (organization.status === "EXPIRED" || organization.status === "SUSPENDED") {
        throw new UploadThingError(
          `Organization is ${organization.status}. Please renew your subscription.`
        );
      }

      // Check if Media Library feature is enabled
      if (!organization.enabledFeatures?.includes("media_library")) {
        throw new UploadThingError(
          "Media Library feature is not enabled for your organization. Please upgrade your plan."
        );
      }

      // Check storage limit
      const storageUsage = await prisma.mediaFile.aggregate({
        where: { organizationId },
        _sum: { size: true },
      });

      const totalUsedBytes = storageUsage._sum?.size || 0;
      const maxStorageBytes = organization.maxStorageGB * 1024 * 1024 * 1024; // GB to bytes

      if (totalUsedBytes >= maxStorageBytes) {
        const usedGB = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
        throw new UploadThingError(
          `Storage limit reached (${usedGB}GB / ${organization.maxStorageGB}GB). Please upgrade your plan.`
        );
      }

      // Return metadata to be used in onUploadComplete
      return {
        userId,
        organizationId,
        organizationName: organization.name,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File name:", file.name);
      console.log("File size:", file.size);

      // Get file extension and MIME type
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

      // Estimate duration based on file size (approximate)
      // For actual duration, you'd need to parse the audio file
      // Average bitrate ~128kbps for MP3, so rough estimate:
      const estimatedDurationSeconds = file.size / (128 * 1024 / 8);

      // Save to database
      const mediaFile = await prisma.mediaFile.create({
        data: {
          organizationId: metadata.organizationId,
          uploadedById: metadata.userId,
          name: file.name,
          originalName: file.name,
          url: file.url,
          size: file.size,
          mimeType: file.type || `audio/${fileExtension}`,
          type: "AUDIO",
          duration: Math.round(estimatedDurationSeconds),
          category: "OTHER", // Default category, user will update later
          tags: "[]",
          usageCount: 0,
        },
      });

      console.log("Media file saved to database:", mediaFile.id);

      // Return data to the client
      return {
        uploadedBy: metadata.userId,
        fileId: mediaFile.id,
        fileName: file.name,
        organizationName: metadata.organizationName,
      };
    }),

  // Image uploader for advertisements (banner images, campaign graphics)
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();

      if (!session?.user) {
        throw new UploadThingError("Unauthorized - Please log in");
      }

      const userId = session.user.id;
      const organizationId = session.user.organizationId;

      if (!organizationId) {
        throw new UploadThingError("No organization found");
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          status: true,
          enabledFeatures: true,
        },
      });

      if (!organization) {
        throw new UploadThingError("Organization not found");
      }

      if (organization.status === "EXPIRED" || organization.status === "SUSPENDED") {
        throw new UploadThingError(
          `Organization is ${organization.status}. Please renew your subscription.`
        );
      }

      // Images can be used for ads or general media
      const hasMediaLibrary = organization.enabledFeatures?.includes("media_library");
      const hasAdvertisements = organization.enabledFeatures?.includes("advertisements");

      if (!hasMediaLibrary && !hasAdvertisements) {
        throw new UploadThingError(
          "Media Library or Advertisements feature must be enabled."
        );
      }

      return {
        userId,
        organizationId,
        organizationName: organization.name,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("Image URL:", file.url);

      // Save to database as media file
      const mediaFile = await prisma.mediaFile.create({
        data: {
          organizationId: metadata.organizationId,
          uploadedById: metadata.userId,
          name: file.name,
          originalName: file.name,
          url: file.url,
          size: file.size,
          mimeType: file.type || "image/jpeg",
          type: "IMAGE",
          category: "OTHER",
          tags: "[]",
          usageCount: 0,
        },
      });

      return {
        uploadedBy: metadata.userId,
        fileId: mediaFile.id,
        fileName: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
