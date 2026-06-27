import type { JobProgress } from "@/types/job";
import type { EngineId } from "./types/engine.types";

export const CORE_ENGINE_STEPS: Record<
  EngineId,
  { id: string; label: string; progress: JobProgress; status?: "GENERATING_IMAGES" }
> = {
  decision: {
    id: "core-decision",
    label: "🤔 작성 가치 판단 중...",
    progress: 0,
  },
  research: {
    id: "core-research",
    label: "🔍 키워드 분석 중...",
    progress: 0,
  },
  writing: {
    id: "core-writing",
    label: "✍️ 초안 작성 중...",
    progress: 20,
  },
  image: {
    id: "core-image",
    label: "🖼️ 이미지 설계 중...",
    progress: 40,
    status: "GENERATING_IMAGES",
  },
  publishing: {
    id: "core-publishing",
    label: "🚀 네이버 발행 준비 중...",
    progress: 80,
  },
  quality: {
    id: "core-quality",
    label: "📝 품질 개선 중...",
    progress: 40,
  },
  history: {
    id: "core-history",
    label: "💾 저장 중...",
    progress: 80,
  },
  scheduler: {
    id: "core-scheduler",
    label: "⏰ 스케줄 기록 중...",
    progress: 80,
  },
};
