import { z } from "zod";
import { BLOG_FAQ_COUNT } from "@/lib/markdown/blog-content-guidelines";

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const v3SeoAnalysisSchema = z.object({
  searchIntent: z.string().min(1),
  coreKeyword: z.string().min(1),
  relatedKeywords: z.array(z.string().min(1)).min(5).max(15),
  longTailKeywords: z.array(z.string().min(1)).min(3).max(10),
  targetAudience: z.string().min(1),
  userQuestions: z.array(z.string().min(1)).min(3),
  contentAngle: z.string().min(1),
  summary: z.string().min(1),
});

export const v3DraftV1Schema = z.object({
  titles: z.array(z.string().min(1)).length(10),
  selectedTitle: z.string().min(1),
  content: z.string().min(2500).max(5000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
  cta: z.string().min(1),
});

export const v3HumanRewriteSchema = z.object({
  content: z.string().min(2500).max(5000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
  cta: z.string().min(1),
});

export const v3ReadabilitySchema = z.object({
  content: z.string().min(2500).max(5000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  metaDescription: z.string().min(80).max(160),
  cta: z.string().min(1),
});

export const v3ImageCountSchema = z.object({
  bodyImageCount: z.number().int().min(2).max(10),
  reason: z.string().min(1),
  sectionPrompts: z
    .array(
      z.object({
        sectionHeading: z.string().min(1),
        englishPrompt: z.string().min(20),
        placement: z.enum(["after_intro", "after_h2", "before_closing"]),
      }),
    )
    .min(2)
    .max(10),
  coverPrompt: z.string().min(20),
  thumbnailText: z.string().min(5).max(30),
});

export const v3FinalQualitySchema = z.object({
  qualityScore: z.number().min(0).max(100),
  passed: z.boolean(),
  criteria: z.object({
    aiTone: z.number().min(0).max(20),
    repetition: z.number().min(0).max(20),
    readability: z.number().min(0).max(20),
    seo: z.number().min(0).max(20),
    structure: z.number().min(0).max(20),
  }),
  issues: z.array(z.string().min(1)),
  summary: z.string().min(1),
  needsRewrite: z.boolean(),
});

export type V3SeoAnalysis = z.infer<typeof v3SeoAnalysisSchema>;
export type V3DraftV1 = z.infer<typeof v3DraftV1Schema>;
export type V3HumanRewrite = z.infer<typeof v3HumanRewriteSchema>;
export type V3Readability = z.infer<typeof v3ReadabilitySchema>;
export type V3ImageCount = z.infer<typeof v3ImageCountSchema>;
export type V3FinalQuality = z.infer<typeof v3FinalQualitySchema>;

export function resolveBodyImageCountByLength(charCount: number): { min: number; max: number } {
  if (charCount <= 1000) return { min: 2, max: 3 };
  if (charCount <= 2500) return { min: 4, max: 5 };
  if (charCount <= 4000) return { min: 6, max: 8 };
  return { min: 8, max: 10 };
}
