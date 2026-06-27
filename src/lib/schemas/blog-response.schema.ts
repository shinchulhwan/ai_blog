import { z } from "zod";

const altTagsSchema = z.object({
  representative: z.string().min(1),
  body: z.array(z.string().min(1)).length(5),
});

const imageFilenamesSchema = z.object({
  representative: z.string().min(1),
  body: z.array(z.string().min(1)).length(5),
});

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const reviewSchema = z.object({
  title: z.number().min(0).max(20),
  seo: z.number().min(0).max(20),
  readability: z.number().min(0).max(20),
  humanWriting: z.number().min(0).max(20),
  duplicates: z.number().min(0).max(20),
});

/** Full AI blog JSON response (final output only) */
export const blogFullResponseSchema = z.object({
  titles: z.array(z.string().min(1)).length(10),
  selectedTitle: z.string().min(1),
  metaDescription: z.string().min(1),
  content: z.string().min(1),
  faq: z.array(faqItemSchema).length(5),
  hashtags: z.array(z.string()),
  representativeImagePrompt: z.string().min(1),
  bodyImagePrompts: z.array(z.string().min(1)).length(5),
  thumbnailText: z.string().min(1),
  altTags: altTagsSchema,
  imageFilenames: imageFilenamesSchema,
  seoScore: z.number().min(0).max(100),
  review: reviewSchema,
});

/** Step 1: keyword analysis */
export const keywordAnalysisSchema = z.object({
  coreKeyword: z.string().min(1),
  relatedKeywords: z.array(z.string()).min(1),
  searchTrend: z.string().min(1),
  competition: z.string().min(1),
  targetAudience: z.string().min(1),
  summary: z.string().min(1),
});

/** Step 2: ten SEO title candidates */
export const titleCandidatesSchema = z.object({
  titles: z.array(z.string().min(1)).length(10),
});

/** Step 3: best CTR title selection */
export const titleSelectionSchema = z.object({
  selectedTitle: z.string().min(1),
  reason: z.string().min(1),
});

/** Step 4: search intent analysis */
export const searchIntentSchema = z.object({
  primaryIntent: z.string().min(1),
  userGoal: z.string().min(1),
  userQuestions: z.array(z.string()).min(1),
  contentAngle: z.string().min(1),
});

/** Step 5: article structure */
export const articleStructureSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        purpose: z.string().min(1),
        keyPoints: z.array(z.string()).min(1),
      }),
    )
    .min(3),
});

/** Step 6: body content (2500~3500 Korean characters) */
export const bodyContentSchema = z.object({
  content: z.string().min(2500).max(4000),
});

/** Step 7: FAQ (exactly 5) */
export const faqGenerationSchema = z.object({
  faq: z.array(faqItemSchema).length(5),
});

/** Step 8: hashtags */
export const hashtagsGenerationSchema = z.object({
  hashtags: z.array(z.string()).min(5).max(10),
});

/** Step 9: meta description */
export const metaDescriptionSchema = z.object({
  metaDescription: z.string().min(80).max(160),
});

/** Step 10: image assets (representative + body + thumbnail + alt + filenames) */
export const imageAssetsSchema = z.object({
  representativeImagePrompt: z.string().min(1),
  bodyImagePrompts: z.array(z.string().min(1)).length(5),
  thumbnailText: z.string().min(1),
  altTags: altTagsSchema,
  imageFilenames: imageFilenamesSchema,
});

/** Combined article fields for revision */
export const blogArticleSchema = z.object({
  metaDescription: z.string().min(80).max(160),
  content: z.string().min(2500).max(4000),
  faq: z.array(faqItemSchema).length(5),
  hashtags: z.array(z.string()).min(5).max(10),
});

/** @deprecated Use imageAssetsSchema */
export const imagePromptSchema = z.object({
  imagePrompt: z.string().min(1),
});

/** Step 11: self-evaluation (each criterion 0–20, total 0–100) */
export const blogEvaluationSchema = z.object({
  titleAppeal: z.number().min(0).max(20),
  seo: z.number().min(0).max(20),
  readability: z.number().min(0).max(20),
  humanLike: z.number().min(0).max(20),
  noDuplicateExpressions: z.number().min(0).max(20),
  totalScore: z.number().min(0).max(100),
  feedback: z.string().min(1),
});

/** Schema for OpenAI structured output and API response */
export const blogPostAiSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  description: z.string().min(1, "설명을 입력해 주세요."),
  content: z.string().min(1, "본문을 입력해 주세요."),
  hashtags: z.array(z.string()),
});

/** Korean SEO blog: title, content, hashtags (legacy UI mapping) */
export const koreanSeoBlogSchema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "본문을 입력해 주세요."),
  hashtags: z.array(z.string()),
});

export type BlogFullResponse = z.infer<typeof blogFullResponseSchema>;
export type BlogArticleDraft = z.infer<typeof blogArticleSchema>;
export type BlogPostAiResponse = z.infer<typeof blogPostAiSchema>;
export type KoreanSeoBlogResponse = z.infer<typeof koreanSeoBlogSchema>;
export type BlogEvaluation = z.infer<typeof blogEvaluationSchema>;
export type KeywordAnalysis = z.infer<typeof keywordAnalysisSchema>;
export type SearchIntent = z.infer<typeof searchIntentSchema>;
export type ArticleStructure = z.infer<typeof articleStructureSchema>;

/** @deprecated Use blogPostAiSchema */
export const blogPostResponseSchema = blogPostAiSchema;
