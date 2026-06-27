import type { PublishOutput } from "@/modules/publishing";
import type { KeywordRecord } from "@/types/keyword";
import type { GenerationJobRecord } from "@/types/job";
import type { ResearchRecord } from "@/types/research";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type {
  BodyDraft,
  TitleGenerationResult,
} from "@/modules/writer/services/writer-pipeline.steps";

export interface AutoPublishWorkflowResult {
  result: BlogFullResponse;
  researchId: string;
  historyId: string;
  keywordId: string;
  jobId: string;
  publishOutput?: PublishOutput;
}

export interface AutoPublishState {
  keyword: string;
  keywordRecord?: KeywordRecord;
  job?: GenerationJobRecord;
  research?: ResearchRecord;
  titleData?: TitleGenerationResult;
  draft?: BodyDraft;
  result?: BlogFullResponse;
  historyId?: string;
  publishOutput?: PublishOutput;
}

export const AUTO_PUBLISH_STEPS = {
  keywordSave: {
    id: "keyword",
    label: "🔍 키워드 저장 중...",
    progress: 0 as const,
  },
  jobCreate: {
    id: "job",
    label: "⚙️ 작업 준비 중...",
    progress: 0 as const,
  },
  research: {
    id: "research",
    label: "🔍 키워드 분석 중...",
    progress: 0 as const,
    status: "GENERATING" as const,
  },
  writer: {
    id: "writer",
    label: "🧠 초안 작성 중...",
    progress: 20 as const,
  },
  reviewer: {
    id: "reviewer",
    label: "📝 AI 리뷰 중...",
    progress: 40 as const,
  },
  seoCheck: {
    id: "seo-analyzer",
    label: "📈 SEO 검사 중...",
    progress: 60 as const,
  },
  humanizer: {
    id: "humanizer",
    label: "✨ 사람처럼 수정 중...",
    progress: 80 as const,
    status: "GENERATING_IMAGES" as const,
  },
  historySave: {
    id: "history",
    label: "💾 저장 중...",
    progress: 80 as const,
  },
  publishing: {
    id: "publishing",
    label: "📤 발행 준비 중...",
    progress: 80 as const,
  },
  complete: {
    id: "complete",
    label: "✅ 완료",
    progress: 100 as const,
    status: "COMPLETED" as const,
  },
} as const;
