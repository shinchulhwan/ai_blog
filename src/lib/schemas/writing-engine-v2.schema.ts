import { z } from "zod";
import { BLOG_FAQ_COUNT, BLOG_H2_SECTION_MIN } from "@/lib/markdown/blog-content-guidelines";

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/** Search Intent Analyzer */
export const intentAnalysisSchema = z.object({
  searchIntent: z.string().min(1),
  targetAudience: z.string().min(1),
  contentPurpose: z.string().min(1),
  userQuestions: z.array(z.string().min(1)).min(3),
  contentAngle: z.string().min(1),
  summary: z.string().min(1),
});

/** Content Planner */
export const contentPlanSchema = z.object({
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
  narrativeFlow: z.string().min(1),
  faqPlan: z
    .array(
      z.object({
        question: z.string().min(1),
        answerOutline: z.string().min(1),
      }),
    )
    .length(BLOG_FAQ_COUNT),
  suggestedTitles: z.array(z.string().min(1)).min(5),
  estimatedTone: z.string().min(1),
});

/** Draft Writer v2 body output */
export const draftWriterOutputSchema = z.object({
  selectedTitle: z.string().min(1),
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
});

/** SEO Optimizer */
export const seoOptimizerOutputSchema = z.object({
  titles: z.array(z.string().min(1)).length(10),
  selectedTitle: z.string().min(1),
  content: z.string().min(2500).max(4000),
  metaDescription: z.string().min(80).max(160),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  keywordNotes: z.string().min(1),
});

/** Final Validator */
export const finalValidationSchema = z.object({
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

/** Validator-driven rewrite */
export const validationRewriteSchema = z.object({
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
});

export type IntentAnalysis = z.infer<typeof intentAnalysisSchema>;
export type ContentPlan = z.infer<typeof contentPlanSchema>;
export type DraftWriterOutput = z.infer<typeof draftWriterOutputSchema>;
export type SeoOptimizerOutput = z.infer<typeof seoOptimizerOutputSchema>;
export type FinalValidation = z.infer<typeof finalValidationSchema>;
export type ValidationRewrite = z.infer<typeof validationRewriteSchema>;

export const VALIDATOR_PASSING_SCORE = 95;
export const MAX_VALIDATOR_RETRIES = 2;
