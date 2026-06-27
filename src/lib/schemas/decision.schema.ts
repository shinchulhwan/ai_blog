import { z } from "zod";

const levelSchema = z.enum(["low", "medium", "high"]);

export const decisionAnalysisSchema = z.object({
  worthWriting: z.object({
    score: z.number().min(0).max(100),
    reason: z.string().min(1),
  }),
  searchIntent: z.string().min(1),
  competition: z.object({
    level: levelSchema,
    reason: z.string().min(1),
  }),
  blogTrafficPotential: z.object({
    possible: z.boolean(),
    reason: z.string().min(1),
  }),
  adValue: z.object({
    level: levelSchema,
    reason: z.string().min(1),
  }),
  profitability: z.object({
    level: levelSchema,
    reason: z.string().min(1),
  }),
  historyDuplicate: z.object({
    isDuplicate: z.boolean(),
    matchedHistoryId: z.string().nullable(),
    reason: z.string().min(1),
  }),
  summary: z.string().min(1),
});

export const decisionAiSchema = z.object({
  verdict: z.enum(["GO", "REVIEW", "SKIP"]),
  verdictReason: z.string().min(1),
  analysis: decisionAnalysisSchema,
});

export type DecisionAiResponse = z.infer<typeof decisionAiSchema>;
export type DecisionAnalysisPayload = z.infer<typeof decisionAnalysisSchema>;
