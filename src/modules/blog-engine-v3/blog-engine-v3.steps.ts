import type { JobProgress } from "@/types/job";

export const BLOG_ENGINE_V3_STEPS = {
  seoAnalysis: {
    id: "v3-seo-analysis",
    label: "🔍 SEO 분석 중...",
    progress: 10 as JobProgress,
  },
  draftV1: {
    id: "v3-draft-v1",
    label: "✍️ 1차 초안 작성 중...",
    progress: 20 as JobProgress,
  },
  humanRewrite: {
    id: "v3-human-rewrite",
    label: "🗣️ 사람 말투 리라이팅 중...",
    progress: 30 as JobProgress,
  },
  readability: {
    id: "v3-readability",
    label: "📱 가독성 개선 중...",
    progress: 40 as JobProgress,
  },
  seoOptimize: {
    id: "v3-seo-optimize",
    label: "📈 SEO 최적화 중...",
    progress: 50 as JobProgress,
  },
  imageCount: {
    id: "v3-image-count",
    label: "🖼️ 이미지 개수 분석 중...",
    progress: 60 as JobProgress,
    status: "GENERATING_IMAGES" as const,
  },
  imageGenerate: {
    id: "v3-image-generate",
    label: "🎨 GPT Image 생성 중...",
    progress: 70 as JobProgress,
    status: "GENERATING_IMAGES" as const,
  },
  imageInsert: {
    id: "v3-image-insert",
    label: "📎 이미지 삽입 중...",
    progress: 75 as JobProgress,
    status: "GENERATING_IMAGES" as const,
  },
  finalQuality: {
    id: "v3-final-quality",
    label: "✅ 최종 품질 검사 중...",
    progress: 80 as JobProgress,
  },
  complete: {
    id: "v3-complete",
    label: "✅ V3 엔진 완료",
    progress: 80 as JobProgress,
  },
} as const;
