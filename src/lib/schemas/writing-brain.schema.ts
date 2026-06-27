import { z } from "zod";
import { BLOG_FAQ_COUNT, BLOG_H2_SECTION_MIN } from "@/lib/markdown/blog-content-guidelines";

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const writingBrainIntentSchema = z.object({
  searchIntent: z.string().min(1),
  targetAudience: z.string().min(1),
  contentPurpose: z.string().min(1),
  userQuestions: z.array(z.string().min(1)).min(3),
  contentAngle: z.string().min(1),
  summary: z.string().min(1),
});

export const writingBrainResearchSchema = z.object({
  coreTopic: z.string().min(1),
  keyFacts: z.array(z.string().min(1)).min(5),
  relatedKeywords: z.array(z.string().min(1)).min(5),
  userQuestions: z.array(z.string().min(1)).min(3),
  summary: z.string().min(1),
});

export const writingBrainOutlineSchema = z.object({
  selectedTitle: z.string().min(1),
  titleCandidates: z.array(z.string().min(1)).min(5),
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        purpose: z.string().min(1),
        keyPoints: z.array(z.string().min(1)).min(2),
        flowOrder: z.number().int().min(1),
      }),
    )
    .min(BLOG_H2_SECTION_MIN),
  tableOfContents: z
    .array(
      z.object({
        order: z.number().int().min(1),
        heading: z.string().min(1),
        dwellHook: z.string().min(1),
      }),
    )
    .min(BLOG_H2_SECTION_MIN),
  narrativeFlow: z.string().min(1),
  faqPlan: z
    .array(
      z.object({
        question: z.string().min(1),
        answerOutline: z.string().min(1),
      }),
    )
    .length(BLOG_FAQ_COUNT),
});

export const writingBrainDraftSchema = z.object({
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
});

export const writingBrainQualityReviewSchema = z.object({
  logic: z.number().min(0).max(20),
  readability: z.number().min(0).max(20),
  duplication: z.number().min(0).max(20),
  flow: z.number().min(0).max(20),
  seo: z.number().min(0).max(20),
  totalScore: z.number().min(0).max(100),
  issues: z
    .array(
      z.object({
        category: z.enum(["logic", "readability", "duplication", "flow", "seo"]),
        description: z.string().min(1),
        severity: z.enum(["low", "medium", "high"]),
        section: z.string().nullable(),
      }),
    )
    .min(1),
  summary: z.string().min(1),
  needsRewrite: z.boolean(),
});

export const writingBrainRewriteSchema = z.object({
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
  rewrittenSections: z.array(z.string().min(1)).min(1),
});

export const writingBrainFinalValidationSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  passed: z.boolean(),
  criteria: z.object({
    intentAlignment: z.number().min(0).max(20),
    contentQuality: z.number().min(0).max(20),
    readability: z.number().min(0).max(20),
    seo: z.number().min(0).max(20),
    humanWriting: z.number().min(0).max(20),
  }),
  issues: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  needsRewrite: z.boolean(),
});

export type WritingBrainIntent = z.infer<typeof writingBrainIntentSchema>;
export type WritingBrainResearch = z.infer<typeof writingBrainResearchSchema>;
export type WritingBrainOutline = z.infer<typeof writingBrainOutlineSchema>;
export type WritingBrainDraft = z.infer<typeof writingBrainDraftSchema>;
export type WritingBrainQualityReview = z.infer<typeof writingBrainQualityReviewSchema>;
export type WritingBrainRewrite = z.infer<typeof writingBrainRewriteSchema>;
export type WritingBrainFinalValidation = z.infer<typeof writingBrainFinalValidationSchema>;

export const WRITING_BRAIN_PASSING_SCORE = 95;
