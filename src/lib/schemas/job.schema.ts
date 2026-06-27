import { z } from "zod";

export const jobStatusSchema = z.enum([
  "PENDING",
  "GENERATING",
  "GENERATING_IMAGES",
  "COMPLETED",
  "FAILED",
]);

export const jobProgressSchema = z.union([
  z.literal(0),
  z.literal(20),
  z.literal(40),
  z.literal(60),
  z.literal(80),
  z.literal(100),
]);

export const createJobSchema = z.object({
  projectId: z.string().trim().min(1, "프로젝트를 선택해 주세요."),
  keyword: z
    .string()
    .trim()
    .min(2, "키워드는 2자 이상 입력해 주세요.")
    .max(200, "키워드는 200자 이하로 입력해 주세요."),
});
