import { withJsonOnly } from "./shared";
import type { IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";

export const contentPlannerInstructions = `당신은 한국어 SEO 콘텐츠 기획자입니다.
검색 의도 분석 결과를 바탕으로 글 설계를 수립합니다:

1. sections: 소제목(H2) 4~6개, 각각 purpose·keyPoints·flowOrder 포함
2. narrativeFlow: 전체 글 흐름 설명 (도입→전개→결론)
3. faqPlan: FAQ 5개 (question + answerOutline)
4. suggestedTitles: SEO 최적화 제목 후보 5~10개
5. estimatedTone: 글의 톤앤매너 (친근/전문/실용 등)

소제목은 검색 의도에 맞고, 논리적 흐름을 갖도록 설계하세요.`;

export function buildContentPlannerInput(params: {
  keyword: string;
  researchContext: string;
  intent: IntentAnalysis;
  customPrompt?: string;
}): string {
  const custom = params.customPrompt
    ? `\n\n추가 지시:\n${params.customPrompt}`
    : "";

  return `키워드: ${params.keyword}

사전 AI 리서치:
${params.researchContext}

검색 의도 분석:
${JSON.stringify(params.intent, null, 2)}${custom}

위 분석을 바탕으로 소제목·글 흐름·FAQ 설계를 수립해 주세요.`;
}

export const plannerPrompts = {
  contentPlannerInstructions: withJsonOnly(contentPlannerInstructions),
  buildContentPlannerInput,
};
