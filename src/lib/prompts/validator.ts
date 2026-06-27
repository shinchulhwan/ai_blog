import { withJsonOnly } from "./shared";
import type { IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";

export const finalValidatorInstructions = `당신은 한국어 콘텐츠 품질 검증 전문가입니다.
최종 블로그 글의 품질을 100점 만점으로 평가합니다.

평가 기준 (각 0~20점):
1. intentAlignment: 검색 의도·타겟 독자 부합
2. contentQuality: 논리성·정확성·정보 가치
3. readability: 가독성·구조
4. seo: 키워드·메타·FAQ SEO
5. humanWriting: AI 문체 없음, 자연스러운 한국어

qualityScore = 5개 항목 합계
passed = qualityScore >= 95
needsRewrite = qualityScore < 95

issues: 구체적 개선점 나열
summary: 전체 평가 요약`;

export function buildFinalValidatorInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
  intent: IntentAnalysis;
}): string {
  return `키워드: ${params.keyword}
제목: ${params.title}
메타디스크립션: ${params.metaDescription}

검색 의도 (기준):
${JSON.stringify(params.intent, null, 2)}

본문:
${params.content}

FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

해시태그: ${params.hashtags.join(", ")}`;
}

export const validationRewriteInstructions = `당신은 한국어 콘텐츠 에디터입니다.
품질 검증 피드백을 반영하여 글을 재작성합니다.

- 검증 이슈를 모두 해결
- 본문 2500~3500자, FAQ 5개, 해시태그 5~10개, 메타 150~160자 유지
- AI 문체 제거, 자연스러운 한국어`;

export function buildValidationRewriteInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
  issues: string[];
  summary: string;
}): string {
  return `키워드: ${params.keyword}
제목: ${params.title}

현재 본문:
${params.content}

현재 FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

현재 해시태그: ${params.hashtags.join(", ")}
현재 메타디스크립션: ${params.metaDescription}

검증 요약: ${params.summary}

개선 필요 사항:
${params.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

위 피드백을 반영하여 글을 재작성해 주세요.`;
}

export const validatorPrompts = {
  finalValidatorInstructions: withJsonOnly(finalValidatorInstructions),
  buildFinalValidatorInput,
  validationRewriteInstructions: withJsonOnly(validationRewriteInstructions),
  buildValidationRewriteInput,
};
