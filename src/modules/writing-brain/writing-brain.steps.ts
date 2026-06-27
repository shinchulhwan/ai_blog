import type { JobProgress } from "@/types/job";
import type { WritingBrainStepId } from "./types/writing-brain.types";

export const WRITING_BRAIN_STEPS: Record<
  WritingBrainStepId,
  { id: string; label: string; progress: JobProgress; status?: "GENERATING_IMAGES" }
> = {
  "intent-analysis": {
    id: "wb-intent",
    label: "🔎 검색 의도 분석 중...",
    progress: 20,
  },
  research: {
    id: "wb-research",
    label: "📚 핵심 정보 정리 중...",
    progress: 20,
  },
  outline: {
    id: "wb-outline",
    label: "📋 목차 생성 중...",
    progress: 20,
  },
  draft: {
    id: "wb-draft",
    label: "✍️ 초안 작성 중...",
    progress: 20,
  },
  "quality-review": {
    id: "wb-quality-review",
    label: "📝 품질 검토 중...",
    progress: 40,
  },
  rewrite: {
    id: "wb-rewrite",
    label: "✏️ 부분 재작성 중...",
    progress: 40,
  },
  "final-validation": {
    id: "wb-final-validation",
    label: "✅ 최종 검증 중...",
    progress: 40,
  },
  history: {
    id: "wb-history",
    label: "💾 저장 중...",
    progress: 80,
  },
};
