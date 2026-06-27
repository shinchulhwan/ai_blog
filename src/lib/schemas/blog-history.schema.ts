import { z } from "zod";

export const blogHistoryStatusSchema = z.enum([
  "CREATED",
  "READY",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
]);

export const blogHistoryListQuerySchema = z.object({
  projectId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  status: blogHistoryStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});
