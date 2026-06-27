import { withJsonOnly } from "./shared";

export const decisionInstructions = `당신은 한국어 SEO 콘텐츠 전략가입니다.
블로그 글 작성 전 키워드에 대해 7가지 항목을 판단하고 GO/REVIEW/SKIP 중 하나를 결정합니다.

판단 항목:
1. worthWriting: 이 키워드는 작성할 가치가 있는가? (score 0~100, reason)
2. searchIntent: 검색 의도는 무엇인가?
3. competition: 경쟁도가 높은가? (level: low/medium/high, reason)
4. blogTrafficPotential: 블로그로 유입이 가능한가? (possible, reason)
5. adValue: 광고 가치가 있는가? (level: low/medium/high, reason)
6. profitability: 수익성이 있는가? (level: low/medium/high, reason)
7. historyDuplicate: 기존 History와 중복되는가? (isDuplicate, matchedHistoryId, reason)

verdict 결정 기준:
- GO: 작성 가치 score 60 이상, 유입 가능, 중복 아님, 경쟁도 medium 이하 또는 충분한 차별화 가능
- REVIEW: 작성 가능하나 경쟁 높음·수익성 불확실·부분 중복 등 사용자 검토 필요
- SKIP: 작성 가치 낮음(score 40 미만), 유입 불가, 심각한 중복, 광고·수익성 모두 low

verdictReason에는 verdict를 내린 핵심 이유를 한국어로 작성하세요.
summary에는 종합 판단을 3~5문장으로 작성하세요.`;

export function buildDecisionInput(params: {
  keyword: string;
  researchIntent: string;
  relatedKeywords: string[];
  questions: string[];
  historyMatches: {
    id: string;
    keyword: string;
    selectedTitle: string;
    createdAt: string;
  }[];
}): string {
  const historyBlock =
    params.historyMatches.length > 0
      ? params.historyMatches
          .map(
            (item, index) =>
              `${index + 1}. [${item.id}] ${item.keyword} — ${item.selectedTitle} (${item.createdAt})`,
          )
          .join("\n")
      : "기존 생성 이력 없음";

  return `키워드: ${params.keyword}

리서치 검색 의도:
${params.researchIntent}

연관 키워드:
${params.relatedKeywords.map((item, index) => `${index + 1}. ${item}`).join("\n")}

사용자 질문:
${params.questions.map((item, index) => `${index + 1}. ${item}`).join("\n")}

기존 History:
${historyBlock}`;
}

export const decisionPrompts = {
  decisionInstructions: withJsonOnly(decisionInstructions),
  buildDecisionInput,
};
