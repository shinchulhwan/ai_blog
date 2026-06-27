import { z } from "zod";

export const scheduleRecurrenceSchema = z.enum([
  "ONCE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "CUSTOM",
]);

export const scheduleStatusSchema = z.enum([
  "ACTIVE",
  "PAUSED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const createScheduleSchema = z
  .object({
    projectId: z.string().trim().min(1, "프로젝트를 선택해 주세요."),
    title: z.string().trim().min(1, "제목을 입력해 주세요."),
    keyword: z.string().trim().min(1, "키워드를 입력해 주세요."),
    prompt: z.string().trim().optional().default(""),
    scheduledAt: z.string().datetime({ message: "예약 시간 형식이 올바르지 않습니다." }),
    recurrence: scheduleRecurrenceSchema.optional().default("ONCE"),
    customIntervalMinutes: z.coerce.number().int().min(1).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.recurrence === "CUSTOM" && !value.customIntervalMinutes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "사용자 지정 반복은 간격(분)이 필요합니다.",
        path: ["customIntervalMinutes"],
      });
    }
  });

export const updateScheduleSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    keyword: z.string().trim().min(1).optional(),
    prompt: z.string().trim().optional(),
    scheduledAt: z.string().datetime().optional(),
    recurrence: scheduleRecurrenceSchema.optional(),
    customIntervalMinutes: z.coerce.number().int().min(1).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.recurrence === "CUSTOM" && value.customIntervalMinutes === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "사용자 지정 반복은 간격(분)이 필요합니다.",
        path: ["customIntervalMinutes"],
      });
    }
  });

export const scheduleListQuerySchema = z.object({
  projectId: z.string().trim().optional(),
  status: scheduleStatusSchema.optional(),
  keyword: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
