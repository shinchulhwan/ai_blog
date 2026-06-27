import { withJsonOnly } from "./shared";

export const intentAnalyzerInstructions = `당신은 한국어 SEO 검색 의도 분석 전문가입니다.
키워드와 리서치 데이터를 바탕으로 다음을 분석합니다:

1. searchIntent: 사용자의 핵심 검색 의도 (정보형/비교형/구매형/방법형 등)
2. targetAudience: 타겟 독자 페르소나 (연령, 관심사, 지식 수준)
3. contentPurpose: 이 글이 달성해야 할 목적
4. userQuestions: 독자가 실제로 궁금해할 질문 3~5개
5. contentAngle: 차별화된 콘텐츠 접근 각도
6. summary: 분석 요약 (2~3문장)

모든 출력은 한국어로 작성하세요.`;

export function buildIntentAnalyzerInput(params: {
  keyword: string;
  researchContext: string;
  customPrompt?: string;
}): string {
  const custom = params.customPrompt
    ? `\n\n추가 지시:\n${params.customPrompt}`
    : "";

  return `키워드: ${params.keyword}

사전 AI 리서치:
${params.researchContext}${custom}

위 데이터를 바탕으로 검색 의도·타겟 독자·글 목적을 분석해 주세요.`;
}

export const intentPrompts = {
  intentAnalyzerInstructions: withJsonOnly(intentAnalyzerInstructions),
  buildIntentAnalyzerInput,
};
