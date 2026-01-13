import { z } from "zod";

// ============================================
// Airtime Package Schemas
// ============================================

export const airtimePackageCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Package name must be at least 2 characters")
    .max(100, "Package name must not exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  durationMinutes: z
    .number()
    .min(15, "Minimum duration is 15 minutes")
    .max(480, "Maximum duration is 8 hours"),
  price: z
    .number()
    .min(0, "Price must be a positive number"),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .default("GHS"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  allowedDays: z
    .array(z.number().min(0).max(6))
    .optional(),
  allowedHoursStart: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
  allowedHoursEnd: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)")
    .optional(),
});

export const airtimePackageUpdateSchema = airtimePackageCreateSchema.partial();

// ============================================
// Airtime Booking Schemas (Public)
// ============================================

export const guestTypeSchema = z.enum([
  "PREACHER",
  "ADVERTISER",
  "TALK_SHOW_HOST",
  "MUSICIAN",
  "PODCAST_HOST",
  "OTHER",
]);

export const airtimeBookingCreateSchema = z.object({
  guestName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  guestEmail: z
    .string()
    .email("Invalid email address"),
  guestPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must not exceed 20 characters")
    .regex(/^[+]?[\d\s-]+$/, "Invalid phone number format"),
  guestType: guestTypeSchema,
  guestTypeOther: z
    .string()
    .max(100, "Description must not exceed 100 characters")
    .optional(),
  programTitle: z
    .string()
    .min(2, "Program title must be at least 2 characters")
    .max(200, "Program title must not exceed 200 characters"),
  programDescription: z
    .string()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  packageId: z
    .string()
    .cuid("Invalid package ID"),
  requestedDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date"),
  requestedStartTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

// ============================================
// Admin Booking Schemas
// ============================================

export const airtimeBookingApproveSchema = z.object({
  approvedDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date"),
  approvedStartTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  adminNotes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
});

export const airtimeBookingRejectSchema = z.object({
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(500, "Rejection reason must not exceed 500 characters"),
});

export const airtimeBookingUpdateSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_FAILED",
    "PENDING_REVIEW",
    "APPROVED",
    "REJECTED",
    "SCHEDULED",
    "LIVE",
    "COMPLETED",
    "NO_SHOW",
    "CANCELLED",
    "EXPIRED",
  ]).optional(),
  adminNotes: z
    .string()
    .max(500, "Notes must not exceed 500 characters")
    .optional(),
  approvedDate: z.string().optional(),
  approvedStartTime: z.string().optional(),
  approvedEndTime: z.string().optional(),
});

// ============================================
// Payment Schemas
// ============================================

export const airtimePaymentInitSchema = z.object({
  bookingRef: z
    .string()
    .min(1, "Booking reference is required"),
  paymentMethod: z.enum(["MOBILE_MONEY", "CARD"]).optional(),
  mobileMoneyPhone: z
    .string()
    .regex(/^[+]?[\d\s-]+$/, "Invalid phone number format")
    .optional(),
  mobileMoneyProvider: z.enum(["mtn", "vod", "tgo"]).optional(),
});

// ============================================
// Query/Filter Schemas
// ============================================

export const airtimeBookingsQuerySchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PAYMENT_FAILED",
    "PENDING_REVIEW",
    "APPROVED",
    "REJECTED",
    "SCHEDULED",
    "LIVE",
    "COMPLETED",
    "NO_SHOW",
    "CANCELLED",
    "EXPIRED",
  ]).optional(),
  guestType: guestTypeSchema.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ============================================
// Type Exports
// ============================================

export type AirtimePackageCreate = z.infer<typeof airtimePackageCreateSchema>;
export type AirtimePackageUpdate = z.infer<typeof airtimePackageUpdateSchema>;
export type AirtimeBookingCreate = z.infer<typeof airtimeBookingCreateSchema>;
export type AirtimeBookingApprove = z.infer<typeof airtimeBookingApproveSchema>;
export type AirtimeBookingReject = z.infer<typeof airtimeBookingRejectSchema>;
export type AirtimeBookingUpdate = z.infer<typeof airtimeBookingUpdateSchema>;
export type AirtimePaymentInit = z.infer<typeof airtimePaymentInitSchema>;
export type AirtimeBookingsQuery = z.infer<typeof airtimeBookingsQuerySchema>;
export type GuestType = z.infer<typeof guestTypeSchema>;
