import { z } from "zod";

// Campaign Status
export const CampaignStatus = z.enum([
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]);

// Ad Campaign Schema
export const createAdCampaignSchema = z.object({
  clientId: z.string().cuid("Invalid client ID"),
  name: z.string().min(1, "Campaign name is required").max(255),
  description: z.string().max(1000).optional(),
  budget: z.number().positive("Budget must be positive"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  status: CampaignStatus.default("PENDING"),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export const updateAdCampaignSchema = createAdCampaignSchema.partial();

// Advertisement Schema
export const createAdvertisementSchema = z.object({
  campaignId: z.string().cuid("Invalid campaign ID"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  duration: z.number().int().positive("Duration must be positive"),
  mediaFileId: z.string().cuid("Invalid media file ID").optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE"),
});

export const updateAdvertisementSchema = createAdvertisementSchema.partial().extend({
  campaignId: z.string().cuid().optional(),
});

// Ad Slot Schema (Scheduling)
export const createAdSlotSchema = z.object({
  advertisementId: z.string().cuid("Invalid advertisement ID"),
  scheduledDate: z.string().datetime("Invalid scheduled date").optional(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)").optional(),
  notes: z.string().max(1000).optional(),
});

export const updateAdSlotSchema = createAdSlotSchema.partial();

// Ad Play History Schema
export const recordAdPlaySchema = z.object({
  adSlotId: z.string().cuid("Invalid ad slot ID"),
  programId: z.string().cuid("Invalid program ID").optional(),
  hostId: z.string().cuid("Invalid host ID").optional(),
  duration: z.number().int().positive("Duration must be positive"),
});

// Filter Schemas
export const adCampaignFilterSchema = z.object({
  clientId: z.string().cuid().optional(),
  status: CampaignStatus.optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const advertisementFilterSchema = z.object({
  campaignId: z.string().cuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const adSlotFilterSchema = z.object({
  advertisementId: z.string().cuid().optional(),
  wasPlayed: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Type exports
export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
export type UpdateAdCampaignInput = z.infer<typeof updateAdCampaignSchema>;
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;
export type CreateAdSlotInput = z.infer<typeof createAdSlotSchema>;
export type UpdateAdSlotInput = z.infer<typeof updateAdSlotSchema>;
export type RecordAdPlayInput = z.infer<typeof recordAdPlaySchema>;
export type AdCampaignFilterInput = z.infer<typeof adCampaignFilterSchema>;
export type AdvertisementFilterInput = z.infer<typeof advertisementFilterSchema>;
export type AdSlotFilterInput = z.infer<typeof adSlotFilterSchema>;
