import { z } from "zod";

export const projectStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "프로젝트 이름을 입력해 주세요.").max(100),
  description: z.string().trim().optional().default(""),
  targetAudience: z.string().trim().optional().default(""),
  language: z.string().trim().optional().default("ko"),
  country: z.string().trim().optional().default("KR"),
  status: projectStatusSchema.optional().default("ACTIVE"),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().optional(),
  targetAudience: z.string().trim().optional(),
  language: z.string().trim().optional(),
  country: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
});

export const projectListQuerySchema = z.object({
  status: projectStatusSchema.optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
