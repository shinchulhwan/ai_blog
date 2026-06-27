import { withJsonOnly } from "./shared";
import type { ContentPlan, IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";

export const draftWriterInstructions = `당신은 한국어 SEO 블로그 전문 작가입니다.
SEO Intelligence 기획안에 따라 초안을 작성합니다.

작성 규칙:
- 기획된 소제목(H2)과 목차·흐름을 따를 것
- 답변 우선순위(mustCoverFirst) 항목을 서두에서 먼저 다룰 것
- CTA 위치에 맞게 행동 유도 문구를 자연스럽게 삽입
- 본문 2500~3500자 (마크다운 H2 사용)
- FAQ는 SEO Intelligence에서 생성된 FAQ를 반영
- 해시태그 5~10개
- 메타디스크립션 150~160자
- SEO Intelligence에서 선택된 제목을 selectedTitle로 사용
- 사실 관계를 왜곡하지 말 것
- AI 특유 표현·상투어 최소화`;

export function buildDraftWriterInput(params: {
  keyword: string;
  researchContext: string;
  intent: IntentAnalysis;
  plan: ContentPlan;
  seoIntelligence?: SeoIntelligenceResult;
  customPrompt?: string;
}): string {
  const custom = params.customPrompt
    ? `\n\n추가 지시:\n${params.customPrompt}`
    : "";

  const seoSection = params.seoIntelligence
    ? `\n\nSEO Intelligence (목차·CTA·FAQ·제목):
${JSON.stringify(
        {
          selectedTitle: params.seoIntelligence.titleCandidates.selectedTitle,
          answerPriority: params.seoIntelligence.answerPriority,
          purchaseStage: params.seoIntelligence.purchaseStage,
          tableOfContents: params.seoIntelligence.tableOfContents,
          ctaPlacement: params.seoIntelligence.ctaPlacement,
          faq: params.seoIntelligence.faq,
        },
        null,
        2,
      )}`
    : "";

  return `키워드: ${params.keyword}

사전 AI 리서치:
${params.researchContext}

검색 의도:
${JSON.stringify(params.intent, null, 2)}

콘텐츠 기획:
${JSON.stringify(params.plan, null, 2)}${seoSection}${custom}

기획안에 따라 블로그 초안을 작성해 주세요.`;
}

export const draftWriterV2Prompts = {
  draftWriterInstructions: withJsonOnly(draftWriterInstructions),
  buildDraftWriterInput,
};
