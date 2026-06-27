import { z } from "zod";
import { BLOG_FAQ_COUNT } from "@/lib/markdown/blog-content-guidelines";

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const reviewIssueSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
});

/** Reviewer — 7개 항목 자기 리뷰 */
export const contentReviewSchema = z.object({
  logic: z.number().min(0).max(20),
  accuracy: z.number().min(0).max(20),
  flow: z.number().min(0).max(20),
  duplication: z.number().min(0).max(20),
  seo: z.number().min(0).max(20),
  ctr: z.number().min(0).max(20),
  readability: z.number().min(0).max(20),
  totalScore: z.number().min(0).max(100),
  issues: z.array(reviewIssueSchema).min(1),
  summary: z.string().min(1),
});

/** SEO Analyzer — 점수·평가·개선사항 */
export const seoAnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  evaluation: z.string().min(1),
  improvements: z.array(z.string().min(1)).min(1),
});

/** Humanizer — 사람처럼 수정된 콘텐츠 */
export const humanizerOutputSchema = z.object({
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(BLOG_FAQ_COUNT),
  hashtags: z.array(z.string()).min(5).max(10),
  metaDescription: z.string().min(80).max(160),
});

export type ContentReview = z.infer<typeof contentReviewSchema>;
export type SeoAnalysis = z.infer<typeof seoAnalysisSchema>;
export type HumanizerOutput = z.infer<typeof humanizerOutputSchema>;
export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
