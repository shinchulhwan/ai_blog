import { z } from "zod";

export const keywordStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED"]);

export const createKeywordSchema = z.object({
  projectId: z.string().trim().optional(),
  keyword: z
    .string()
    .trim()
    .min(2, "키워드는 2자 이상 입력해 주세요.")
    .max(200, "키워드는 200자 이하로 입력해 주세요."),
  category: z
    .string()
    .trim()
    .min(1, "카테고리를 입력해 주세요.")
    .max(100, "카테고리는 100자 이하로 입력해 주세요."),
  status: keywordStatusSchema.default("PENDING"),
});

export const updateKeywordSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(2, "키워드는 2자 이상 입력해 주세요.")
    .max(200, "키워드는 200자 이하로 입력해 주세요.")
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, "카테고리를 입력해 주세요.")
    .max(100, "카테고리는 100자 이하로 입력해 주세요.")
    .optional(),
  status: keywordStatusSchema.optional(),
});

export const keywordListQuerySchema = z.object({
  projectId: z.string().trim().optional(),
  status: keywordStatusSchema.optional(),
  category: z.string().trim().optional(),
});

export type CreateKeywordPayload = z.infer<typeof createKeywordSchema>;
export type UpdateKeywordPayload = z.infer<typeof updateKeywordSchema>;
