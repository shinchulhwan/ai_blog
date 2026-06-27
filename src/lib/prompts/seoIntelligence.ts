import { withJsonOnly } from "./shared";
import type {
  AnswerPriority,
  PurchaseStage,
  RealSearchIntent,
  SeoArticleStructure,
  SeoIntelligenceResult,
  SeoTableOfContents,
  SeoTitleCandidates,
} from "@/lib/schemas/seo-intelligence.schema";

function baseInput(keyword: string, researchContext: string, customPrompt?: string): string {
  const custom = customPrompt ? `\n\n추가 지시:\n${customPrompt}` : "";
  return `키워드: ${keyword}\n\n사전 AI 리서치:\n${researchContext}${custom}`;
}

export const realSearchIntentInstructions = withJsonOnly(`당신은 한국어 SEO 검색 의도 분석 전문가입니다.
키워드와 리서치를 바탕으로 검색자의 "진짜 의도"를 분석합니다.
표면적 키워드가 아닌, 검색자가 실제로 해결하려는 근본 니즈를 파악하세요.`);

export function buildRealSearchIntentInput(
  keyword: string,
  researchContext: string,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}\n\n검색자의 진짜 의도를 분석해 주세요.`;
}

export const answerPriorityInstructions = withJsonOnly(`당신은 한국어 SEO 콘텐츠 전략가입니다.
검색 의도 분석 결과를 바탕으로, 검색자가 가장 먼저 원하는 답변의 우선순위를 정렬합니다.
mustCoverFirst=true인 항목은 글 서두에서 반드시 다뤄야 합니다.`);

export function buildAnswerPriorityInput(
  keyword: string,
  researchContext: string,
  searchIntent: RealSearchIntent,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}

검색 의도 분석:
${JSON.stringify(searchIntent, null, 2)}

검색자가 원하는 답변 우선순위를 분석해 주세요.`;
}

export const purchaseStageInstructions = withJsonOnly(`당신은 한국어 마케팅 퍼널 분석가입니다.
검색자가 구매 여정 중 어느 단계에 있는지 분석합니다.

stage 값:
- information: 정보 탐색 (개념·방법·원리)
- comparison: 비교 (제품·서비스·옵션 비교)
- purchase: 구매 (결정·구매·신청 직전)

stageLabel은 한국어로 작성하세요.`);

export function buildPurchaseStageInput(
  keyword: string,
  researchContext: string,
  searchIntent: RealSearchIntent,
  answerPriority: AnswerPriority,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}

검색 의도:
${JSON.stringify(searchIntent, null, 2)}

답변 우선순위:
${JSON.stringify(answerPriority, null, 2)}

독자의 구매 단계를 분석해 주세요.`;
}

export const seoArticleStructureInstructions = withJsonOnly(`당신은 한국어 SEO 콘텐츠 아키텍트입니다.
검색 의도·답변 우선순위·구매 단계에 맞는 최적의 글 구조(H2)를 설계합니다.
각 섹션에 체류시간을 높이는 전략(dwellTimeStrategy)을 포함하세요.`);

export function buildSeoArticleStructureInput(
  keyword: string,
  researchContext: string,
  searchIntent: RealSearchIntent,
  answerPriority: AnswerPriority,
  purchaseStage: PurchaseStage,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}

검색 의도:
${JSON.stringify(searchIntent, null, 2)}

답변 우선순위:
${JSON.stringify(answerPriority, null, 2)}

구매 단계:
${JSON.stringify(purchaseStage, null, 2)}

가장 적합한 글 구조를 생성해 주세요.`;
}

export const seoTitleCandidatesInstructions = withJsonOnly(`당신은 한국어 SEO 제목 카피라이터입니다.
CTR이 높은 제목 후보 10개를 생성하고, 그중 최적 1개를 selectedTitle로 선택하세요.
제목은 25~40자, 키워드 포함, 클릭 유도형이어야 합니다.`);

export function buildSeoTitleCandidatesInput(
  keyword: string,
  researchContext: string,
  searchIntent: RealSearchIntent,
  purchaseStage: PurchaseStage,
  articleStructure: SeoArticleStructure,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}

검색 의도:
${JSON.stringify(searchIntent, null, 2)}

구매 단계:
${JSON.stringify(purchaseStage, null, 2)}

글 구조:
${JSON.stringify(articleStructure, null, 2)}

클릭률이 높은 제목 후보 10개를 생성해 주세요.`;
}

export const seoTableOfContentsInstructions = withJsonOnly(`당신은 한국어 UX·SEO 콘텐츠 기획자입니다.
글 구조와 제목을 바탕으로 체류시간을 높이는 목차를 설계합니다.
각 항목에 dwellHook(독자가 계속 읽게 만드는 이유)과 예상 읽기 시간을 포함하세요.`);

export function buildSeoTableOfContentsInput(
  keyword: string,
  articleStructure: SeoArticleStructure,
  titleCandidates: SeoTitleCandidates,
  customPrompt?: string,
): string {
  return `키워드: ${keyword}
선택된 제목: ${titleCandidates.selectedTitle}

글 구조:
${JSON.stringify(articleStructure, null, 2)}${customPrompt ? `\n\n추가 지시:\n${customPrompt}` : ""}

체류시간을 높이는 목차를 생성해 주세요.`;
}

export const ctaPlacementInstructions = withJsonOnly(`당신은 한국어 콘텐츠 전환율(CVR) 전문가입니다.
글 구조·구매 단계·목차를 바탕으로 CTA(행동 유도) 위치를 결정합니다.
ctaType: soft(정보 제공), medium(관심 유도), strong(구매·신청 유도)`);

export function buildCtaPlacementInput(
  keyword: string,
  purchaseStage: PurchaseStage,
  articleStructure: SeoArticleStructure,
  tableOfContents: SeoTableOfContents,
  customPrompt?: string,
): string {
  return `키워드: ${keyword}

구매 단계:
${JSON.stringify(purchaseStage, null, 2)}

글 구조:
${JSON.stringify(articleStructure, null, 2)}

목차:
${JSON.stringify(tableOfContents, null, 2)}${customPrompt ? `\n\n추가 지시:\n${customPrompt}` : ""}

CTA 위치를 결정해 주세요.`;
}

export const seoFaqGenerationInstructions = withJsonOnly(`당신은 한국어 SEO FAQ 전문가입니다.
검색 의도·답변 우선순위·구매 단계를 반영하여 FAQ 5개를 생성합니다.
각 FAQ에 searchVolumeIntent(검색 의도 유형)와 priority(1=최우선)를 포함하세요.
answer는 2~4문장으로 작성하세요.`);

export function buildSeoFaqGenerationInput(
  keyword: string,
  researchContext: string,
  searchIntent: RealSearchIntent,
  answerPriority: AnswerPriority,
  purchaseStage: PurchaseStage,
  customPrompt?: string,
): string {
  return `${baseInput(keyword, researchContext, customPrompt)}

검색 의도:
${JSON.stringify(searchIntent, null, 2)}

답변 우선순위:
${JSON.stringify(answerPriority, null, 2)}

구매 단계:
${JSON.stringify(purchaseStage, null, 2)}

FAQ 5개를 생성해 주세요.`;
}

export const seoIntelligenceValidationInstructions = withJsonOnly(`당신은 한국어 SEO 품질 검증 전문가입니다.
SEO Intelligence 파이프라인 전체 결과를 검증합니다.

checklist 8개 항목을 true/false로 평가하고,
score는 0~100점, passed는 score >= 80
issues에 미흡한 점을 구체적으로 나열하세요.`);

export function buildSeoIntelligenceValidationInput(
  keyword: string,
  result: Omit<SeoIntelligenceResult, "validation">,
): string {
  return `키워드: ${keyword}

SEO Intelligence 결과:
${JSON.stringify(result, null, 2)}

전체 SEO Intelligence 결과를 최종 검증해 주세요.`;
}

export const seoIntelligencePrompts = {
  realSearchIntentInstructions,
  buildRealSearchIntentInput,
  answerPriorityInstructions,
  buildAnswerPriorityInput,
  purchaseStageInstructions,
  buildPurchaseStageInput,
  seoArticleStructureInstructions,
  buildSeoArticleStructureInput,
  seoTitleCandidatesInstructions,
  buildSeoTitleCandidatesInput,
  seoTableOfContentsInstructions,
  buildSeoTableOfContentsInput,
  ctaPlacementInstructions,
  buildCtaPlacementInput,
  seoFaqGenerationInstructions,
  buildSeoFaqGenerationInput,
  seoIntelligenceValidationInstructions,
  buildSeoIntelligenceValidationInput,
};
