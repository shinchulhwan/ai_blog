import type { EvaluationInput, RevisionInput } from "./types";
import {
  BANNED_AI_PHRASES,
  BLOG_FAQ_COUNT,
  BLOG_H2_SECTION_MIN,
  BLOG_STRUCTURE_TEMPLATE,
  PARAGRAPH_RULES,
} from "@/lib/markdown/blog-content-guidelines";

export const reviewPromptMeta = {
  id: "review" as const,
  name: "Content Review",
  description: "콘텐츠 SEO 자체평가 및 수정 프롬프트",
};

const BANNED_LIST = BANNED_AI_PHRASES.map((p) => `"${p}"`).join(", ");

export const evaluationInstructions = `당신은 깐깐한 한국어 SEO 블로그 편집자입니다.
제시된 블로그 글 전체(제목, 본문, FAQ, 해시태그, 메타디스크립션)를 아래 기준으로 각 0~20점, 총 100점 만점으로 평가합니다.

평가 기준:
1. titleAppeal (제목 매력도): 클릭하고 싶은 제목인가
2. seo: 키워드 자연 분산, H2 구조, 검색 최적화
3. readability (가독성): 문단당 3문장 이하, 소제목, 리스트, 모바일 가독성
4. humanLike (사람처럼 작성되었는가): AI 티, 금지 표현(${BANNED_LIST}), ~합니다 반복 없음
5. noDuplicateExpressions (중복 표현): 같은 표현·문장 반복이 없는가 (높을수록 좋음)

totalScore는 5개 항목 점수의 합입니다.
feedback에는 구체적인 개선점을 한국어로 작성합니다.`;

export const revisionInstructions = `당신은 한국어 SEO 블로그 전문 편집자입니다.
평가 피드백을 반영하여 블로그 글을 한 번 더 수정합니다.

${BLOG_STRUCTURE_TEMPLATE}

${PARAGRAPH_RULES}

규칙:
- 선택된 제목 유지
- 본문 2500~3500자, 마크다운 형식 유지
- H2 ${BLOG_H2_SECTION_MIN}개 이상, 문단당 최대 3문장
- 번호 목록·Bullet·체크리스트 포함
- FAQ 정확히 ${BLOG_FAQ_COUNT}개 (본문 "## 자주 묻는 질문" 포함)
- 해시태그 5~10개
- 메타디스크립션 150~160자
- 금지 표현 제거: ${BANNED_LIST}
- 중복 표현 제거, 자연스러운 한국어, CTA 포함`;

export function buildEvaluationInput(params: EvaluationInput): string {
  return `키워드: ${params.keyword}

제목: ${params.title}

메타디스크립션: ${params.metaDescription}

본문:
${params.content}

FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

해시태그: ${params.hashtags.join(", ")}`;
}

export function buildRevisionInput(params: RevisionInput): string {
  return `키워드: ${params.keyword}
선택된 제목: ${params.title}

현재 메타디스크립션: ${params.metaDescription}

현재 본문:
${params.content}

현재 FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

현재 해시태그: ${params.hashtags.join(", ")}

평가 점수: ${params.evaluation.totalScore}/100
개선 피드백:
${params.evaluation.feedback}

위 피드백을 반영하여 최종본을 작성해 주세요.`;
}

/** Review prompt pack export */
export const reviewPrompts = {
  meta: reviewPromptMeta,
  evaluationInstructions,
  revisionInstructions,
  buildEvaluationInput,
  buildRevisionInput,
} as const;
