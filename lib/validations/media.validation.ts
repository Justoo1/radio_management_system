import { z } from "zod";

export const MediaCategory = z.enum([
  "JINGLE",
  "SOUND_EFFECT",
  "ADVERTISEMENT",
  "INTRO",
  "OUTRO",
  "BUMPER",
  "INTERVIEW",
  "PSA", // Public Service Announcement
  "OTHER",
]);

export const updateMediaFileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255).optional(),
  category: MediaCategory.optional(),
  tags: z.array(z.string()).optional(),
  programId: z.string().cuid().optional().nullable(),
  duration: z.number().positive().optional(),
});

export const mediaFileFilterSchema = z.object({
  category: MediaCategory.optional(),
  programId: z.string().cuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
});

export const deleteMediaFileSchema = z.object({
  id: z.string().cuid(),
});

export type UpdateMediaFileInput = z.infer<typeof updateMediaFileSchema>;
export type MediaFileFilterInput = z.infer<typeof mediaFileFilterSchema>;
export type DeleteMediaFileInput = z.infer<typeof deleteMediaFileSchema>;
