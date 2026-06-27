import { z } from "zod";

/** 1. 검색자의 진짜 의도 분석 */
export const realSearchIntentSchema = z.object({
  primaryIntent: z.string().min(1),
  underlyingNeed: z.string().min(1),
  searchContext: z.string().min(1),
  implicitQuestions: z.array(z.string().min(1)).min(2),
  summary: z.string().min(1),
});

/** 2. 검색자가 원하는 답변 우선순위 */
export const answerPrioritySchema = z.object({
  priorities: z
    .array(
      z.object({
        rank: z.number().int().min(1),
        question: z.string().min(1),
        reason: z.string().min(1),
        mustCoverFirst: z.boolean(),
      }),
    )
    .min(3),
  summary: z.string().min(1),
});

/** 3. 독자 구매 단계 */
export const purchaseStageSchema = z.object({
  stage: z.enum(["information", "comparison", "purchase"]),
  stageLabel: z.string().min(1),
  readerMindset: z.string().min(1),
  contentFocus: z.string().min(1),
  avoidPatterns: z.array(z.string().min(1)).min(1),
});

/** 4. 최적 글 구조 */
export const seoArticleStructureSchema = z.object({
  sections: z
    .array(
      z.object({
        heading: z.string().min(1),
        purpose: z.string().min(1),
        keyPoints: z.array(z.string().min(1)).min(2),
        flowOrder: z.number().int().min(1),
        dwellTimeStrategy: z.string().min(1),
      }),
    )
    .min(4),
  narrativeFlow: z.string().min(1),
  hookStrategy: z.string().min(1),
});

/** 5. CTR 높은 제목 후보 10개 */
export const seoTitleCandidatesSchema = z.object({
  titles: z.array(z.string().min(1)).length(10),
  selectedTitle: z.string().min(1),
  selectionReason: z.string().min(1),
});

/** 6. 체류시간 목차 */
export const seoTableOfContentsSchema = z.object({
  items: z
    .array(
      z.object({
        order: z.number().int().min(1),
        heading: z.string().min(1),
        anchorSlug: z.string().min(1),
        dwellHook: z.string().min(1),
        estimatedReadSeconds: z.number().int().min(30),
      }),
    )
    .min(4),
  scrollDepthStrategy: z.string().min(1),
});

/** 7. CTA 위치 */
export const ctaPlacementSchema = z.object({
  placements: z
    .array(
      z.object({
        afterSection: z.string().min(1),
        ctaType: z.enum(["soft", "medium", "strong"]),
        message: z.string().min(1),
        rationale: z.string().min(1),
      }),
    )
    .min(1),
  primaryCta: z.object({
    position: z.string().min(1),
    text: z.string().min(1),
    goal: z.string().min(1),
  }),
});

/** 8. FAQ 생성 */
export const seoFaqGenerationSchema = z.object({
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        searchVolumeIntent: z.string().min(1),
        priority: z.number().int().min(1),
      }),
    )
    .length(5),
});

/** 9. 최종 SEO 검증 */
export const seoIntelligenceValidationSchema = z.object({
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  checklist: z.object({
    intentCoverage: z.boolean(),
    answerPriority: z.boolean(),
    stageAlignment: z.boolean(),
    structureQuality: z.boolean(),
    titleQuality: z.boolean(),
    tocQuality: z.boolean(),
    ctaQuality: z.boolean(),
    faqQuality: z.boolean(),
  }),
  issues: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
});

export type RealSearchIntent = z.infer<typeof realSearchIntentSchema>;
export type AnswerPriority = z.infer<typeof answerPrioritySchema>;
export type PurchaseStage = z.infer<typeof purchaseStageSchema>;
export type SeoArticleStructure = z.infer<typeof seoArticleStructureSchema>;
export type SeoTitleCandidates = z.infer<typeof seoTitleCandidatesSchema>;
export type SeoTableOfContents = z.infer<typeof seoTableOfContentsSchema>;
export type CtaPlacement = z.infer<typeof ctaPlacementSchema>;
export type SeoFaqGeneration = z.infer<typeof seoFaqGenerationSchema>;
export type SeoIntelligenceValidation = z.infer<
  typeof seoIntelligenceValidationSchema
>;

export interface SeoIntelligenceResult {
  searchIntent: RealSearchIntent;
  answerPriority: AnswerPriority;
  purchaseStage: PurchaseStage;
  articleStructure: SeoArticleStructure;
  titleCandidates: SeoTitleCandidates;
  tableOfContents: SeoTableOfContents;
  ctaPlacement: CtaPlacement;
  faq: SeoFaqGeneration;
  validation: SeoIntelligenceValidation;
}

export const SEO_INTELLIGENCE_PASSING_SCORE = 80;
