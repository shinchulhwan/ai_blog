import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type {
  ContentPlan,
  FinalValidation,
  IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";
import type { DecisionResult } from "@/modules/decision";
import type { ContentReview } from "@/modules/reviewer";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";

export interface QualityPipelineResult {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review: ContentReview;
  validation: FinalValidation;
  result: BlogFullResponse;
  decision: DecisionResult;
  intent: IntentAnalysis;
  plan: ContentPlan;
  seoIntelligence: SeoIntelligenceResult;
}

export const QUALITY_PIPELINE_STEPS = {
  research: {
    id: "research",
    label: "🔍 키워드 분석 중...",
    progress: 0 as const,
    status: "GENERATING" as const,
  },
  decision: {
    id: "decision",
    label: "🤔 작성 가치 판단 중...",
    progress: 0 as const,
    status: "GENERATING" as const,
  },
  seoIntelligence: {
    id: "seo-intelligence",
    label: "🧠 SEO 인텔리전스 분석 중...",
    progress: 0 as const,
  },
  intent: {
    id: "intent",
    label: "🔎 검색 의도 분석 중...",
    progress: 0 as const,
  },
  planner: {
    id: "planner",
    label: "📋 콘텐츠 설계 중...",
    progress: 20 as const,
  },
  writer: {
    id: "writer",
    label: "✍️ 초안 작성 중...",
    progress: 20 as const,
  },
  reviewer: {
    id: "reviewer",
    label: "📝 논리·흐름 검토 중...",
    progress: 40 as const,
  },
  humanizer: {
    id: "humanizer",
    label: "✨ 사람처럼 수정 중...",
    progress: 60 as const,
    status: "GENERATING_IMAGES" as const,
  },
  seoOptimizer: {
    id: "seo-optimizer",
    label: "📈 SEO 최적화 중...",
    progress: 80 as const,
  },
  validator: {
    id: "validator",
    label: "✅ 품질 검증 중...",
    progress: 80 as const,
  },
  finalOutput: {
    id: "final",
    label: "💾 저장 중...",
    progress: 80 as const,
  },
} as const;

export function assembleQualityResult(
  titleData: TitleGenerationResult,
  draft: BodyDraft,
  review: ContentReview,
  validation: FinalValidation,
): BlogFullResponse {
  return {
    titles: titleData.titles,
    selectedTitle: titleData.selectedTitle,
    metaDescription: draft.metaDescription,
    content: draft.content,
    faq: draft.faq,
    hashtags: draft.hashtags,
    ...draft.imageAssets,
    seoScore: validation.qualityScore,
    review: {
      title: review.ctr,
      seo: review.seo,
      readability: review.readability,
      humanWriting: validation.criteria.humanWriting,
      duplicates: review.duplication,
    },
  };
}
