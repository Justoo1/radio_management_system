import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const CampaignStatus = z.enum([
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]);

export const AdScheduleType = z.enum([
  "TIME_SLOT",
  "FLEXIBLE",
  "PROGRAM_BASED",
  "DAYPART_BASED",
]);

export const CampaignFulfillmentStatus = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "ON_TRACK",
  "BEHIND",
  "COMPLETED",
  "OVER_DELIVERED",
]);

export const AdPackageType = z.enum([
  "PLAY_COUNT",
  "TIME_SLOT",
  "PROGRAM_BASED",
  "DAYPART",
]);

export const AdPlayStatus = z.enum([
  "COMPLETED",
  "PARTIAL",
  "SKIPPED",
  "FAILED",
]);

export const AdStatus = z.enum(["ACTIVE", "PAUSED", "COMPLETED"]);

// ============================================
// DAYPART SCHEMAS
// ============================================

// Time format validation (HH:MM)
const timeFormat = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)");

export const createAdDaypartSchema = z.object({
  name: z.string().min(1, "Daypart name is required").max(100),
  startTime: timeFormat,
  endTime: timeFormat,
  monday: z.boolean().default(true),
  tuesday: z.boolean().default(true),
  wednesday: z.boolean().default(true),
  thursday: z.boolean().default(true),
  friday: z.boolean().default(true),
  saturday: z.boolean().default(true),
  sunday: z.boolean().default(true),
  priceMultiplier: z.number().min(0.1).max(10).default(1.0),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate that at least one day is selected
    return data.monday || data.tuesday || data.wednesday ||
           data.thursday || data.friday || data.saturday || data.sunday;
  },
  {
    message: "At least one day must be selected",
    path: ["monday"],
  }
);

export const updateAdDaypartSchema = createAdDaypartSchema.partial();

// ============================================
// PACKAGE SCHEMAS
// ============================================

export const createAdPackageSchema = z.object({
  name: z.string().min(1, "Package name is required").max(255),
  description: z.string().max(1000).optional(),
  packageType: AdPackageType,
  totalPlays: z.number().int().positive().optional(),
  durationDays: z.number().int().positive().optional(),
  playsPerDay: z.number().int().positive().optional(),
  basePrice: z.number().positive("Price must be positive"),
  currency: z.string().default("GHS"),
  daypartId: z.string().cuid("Invalid daypart ID").optional().nullable(),
  programId: z.string().cuid("Invalid program ID").optional().nullable(),
  maxDuration: z.number().int().positive().default(60),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate type-specific required fields
    if (data.packageType === "PLAY_COUNT" && !data.totalPlays) {
      return false;
    }
    if (data.packageType === "TIME_SLOT" && (!data.durationDays || !data.playsPerDay)) {
      return false;
    }
    if (data.packageType === "PROGRAM_BASED" && !data.programId) {
      return false;
    }
    if (data.packageType === "DAYPART" && !data.daypartId) {
      return false;
    }
    return true;
  },
  {
    message: "Missing required fields for the selected package type",
    path: ["packageType"],
  }
);

export const updateAdPackageSchema = createAdPackageSchema.partial();

// ============================================
// CAMPAIGN SCHEMAS (Enhanced)
// ============================================

export const createAdCampaignSchema = z.object({
  clientId: z.string().cuid("Invalid client ID"),
  name: z.string().min(1, "Campaign name is required").max(255),
  description: z.string().max(1000).optional(),
  budget: z.number().positive("Budget must be positive").optional(),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  status: CampaignStatus.default("PENDING"),
  // Package integration
  packageId: z.string().cuid("Invalid package ID").optional().nullable(),
  scheduleType: AdScheduleType.default("TIME_SLOT"),
  targetPlays: z.number().int().positive().optional(),
  // Target constraints
  targetProgramId: z.string().cuid("Invalid program ID").optional().nullable(),
  targetDaypartId: z.string().cuid("Invalid daypart ID").optional().nullable(),
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
).refine(
  (data) => {
    // If schedule type is PROGRAM_BASED, require target program
    if (data.scheduleType === "PROGRAM_BASED" && !data.targetProgramId) {
      return false;
    }
    return true;
  },
  {
    message: "Target program is required for program-based scheduling",
    path: ["targetProgramId"],
  }
).refine(
  (data) => {
    // If schedule type is DAYPART_BASED, require target daypart
    if (data.scheduleType === "DAYPART_BASED" && !data.targetDaypartId) {
      return false;
    }
    return true;
  },
  {
    message: "Target daypart is required for daypart-based scheduling",
    path: ["targetDaypartId"],
  }
);

export const updateAdCampaignSchema = z.object({
  clientId: z.string().cuid("Invalid client ID").optional(),
  name: z.string().min(1, "Campaign name is required").max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  budget: z.number().positive("Budget must be positive").optional().nullable(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  status: CampaignStatus.optional(),
  packageId: z.string().cuid("Invalid package ID").optional().nullable(),
  scheduleType: AdScheduleType.optional(),
  targetPlays: z.number().int().positive().optional().nullable(),
  targetProgramId: z.string().cuid("Invalid program ID").optional().nullable(),
  targetDaypartId: z.string().cuid("Invalid daypart ID").optional().nullable(),
  fulfillmentStatus: CampaignFulfillmentStatus.optional(),
});

// ============================================
// ADVERTISEMENT SCHEMAS
// ============================================

export const createAdvertisementSchema = z.object({
  campaignId: z.string().cuid("Invalid campaign ID"),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional(),
  duration: z.number().int().positive("Duration must be positive"),
  mediaFileId: z.string().cuid("Invalid media file ID").optional().nullable(),
  status: AdStatus.default("ACTIVE"),
});

export const updateAdvertisementSchema = createAdvertisementSchema.partial().extend({
  campaignId: z.string().cuid().optional(),
});

// ============================================
// AD SLOT SCHEMAS
// ============================================

export const createAdSlotSchema = z.object({
  advertisementId: z.string().cuid("Invalid advertisement ID"),
  scheduledDate: z.string().datetime("Invalid scheduled date"),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
  notes: z.string().max(1000).optional(),
});

export const updateAdSlotSchema = createAdSlotSchema.partial();

// Bulk slot creation for easier scheduling
export const createBulkAdSlotsSchema = z.object({
  advertisementId: z.string().cuid("Invalid advertisement ID"),
  slots: z.array(z.object({
    scheduledDate: z.string().datetime("Invalid scheduled date"),
    scheduledTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
    notes: z.string().max(1000).optional(),
  })).min(1, "At least one slot is required"),
});

// ============================================
// PLAY HISTORY SCHEMAS (Enhanced)
// ============================================

export const recordAdPlaySchema = z.object({
  advertisementId: z.string().cuid("Invalid advertisement ID"),
  adSlotId: z.string().cuid("Invalid ad slot ID").optional(),
  playDuration: z.number().int().positive("Duration must be positive"),
  programId: z.string().cuid("Invalid program ID").optional().nullable(),
  presenterId: z.string().cuid("Invalid presenter ID").optional().nullable(),
  daypartName: z.string().max(100).optional(),
  playStatus: AdPlayStatus.default("COMPLETED"),
  notes: z.string().max(1000).optional(),
});

// ============================================
// INVOICE GENERATION SCHEMA
// ============================================

// Date string validation that accepts both YYYY-MM-DD and ISO datetime formats
const dateString = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  },
  { message: "Invalid date format" }
);

export const generateCampaignInvoiceSchema = z.object({
  campaignId: z.string().cuid("Invalid campaign ID"),
  dueDate: dateString.optional(),
  notes: z.string().max(1000).optional(),
  includeBreakdown: z.boolean().default(true), // Include daypart/program breakdown
});

// ============================================
// FILTER SCHEMAS
// ============================================

export const adCampaignFilterSchema = z.object({
  clientId: z.string().cuid().optional(),
  status: CampaignStatus.optional(),
  fulfillmentStatus: CampaignFulfillmentStatus.optional(),
  scheduleType: AdScheduleType.optional(),
  packageId: z.string().cuid().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const advertisementFilterSchema = z.object({
  campaignId: z.string().cuid().optional(),
  status: AdStatus.optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const adSlotFilterSchema = z.object({
  advertisementId: z.string().cuid().optional(),
  wasPlayed: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const adPlayHistoryFilterSchema = z.object({
  advertisementId: z.string().cuid().optional(),
  campaignId: z.string().cuid().optional(),
  programId: z.string().cuid().optional(),
  presenterId: z.string().cuid().optional(),
  playStatus: AdPlayStatus.optional(),
  daypartName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const adPackageFilterSchema = z.object({
  packageType: AdPackageType.optional(),
  daypartId: z.string().cuid().optional(),
  programId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const adDaypartFilterSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

// Analytics filter schema
export const adAnalyticsFilterSchema = z.object({
  campaignId: z.string().cuid().optional(),
  programId: z.string().cuid().optional(),
  daypartName: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(["day", "hour", "dayOfWeek", "program", "daypart", "campaign"]).default("day"),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateAdDaypartInput = z.infer<typeof createAdDaypartSchema>;
export type UpdateAdDaypartInput = z.infer<typeof updateAdDaypartSchema>;
export type CreateAdPackageInput = z.infer<typeof createAdPackageSchema>;
export type UpdateAdPackageInput = z.infer<typeof updateAdPackageSchema>;
export type CreateAdCampaignInput = z.infer<typeof createAdCampaignSchema>;
export type UpdateAdCampaignInput = z.infer<typeof updateAdCampaignSchema>;
export type CreateAdvertisementInput = z.infer<typeof createAdvertisementSchema>;
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;
export type CreateAdSlotInput = z.infer<typeof createAdSlotSchema>;
export type UpdateAdSlotInput = z.infer<typeof updateAdSlotSchema>;
export type CreateBulkAdSlotsInput = z.infer<typeof createBulkAdSlotsSchema>;
export type RecordAdPlayInput = z.infer<typeof recordAdPlaySchema>;
export type GenerateCampaignInvoiceInput = z.infer<typeof generateCampaignInvoiceSchema>;
export type AdCampaignFilterInput = z.infer<typeof adCampaignFilterSchema>;
export type AdvertisementFilterInput = z.infer<typeof advertisementFilterSchema>;
export type AdSlotFilterInput = z.infer<typeof adSlotFilterSchema>;
export type AdPlayHistoryFilterInput = z.infer<typeof adPlayHistoryFilterSchema>;
export type AdPackageFilterInput = z.infer<typeof adPackageFilterSchema>;
export type AdDaypartFilterInput = z.infer<typeof adDaypartFilterSchema>;
export type AdAnalyticsFilterInput = z.infer<typeof adAnalyticsFilterSchema>;
