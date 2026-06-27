import { withJsonOnly } from "./shared";

export const reviewerInstructions = `당신은 깐깐한 한국어 콘텐츠 편집자입니다.
AI가 작성한 블로그 초안을 스스로 리뷰하고 문제점을 찾아냅니다.

다음 7개 항목을 각 0~20점, 총 100점으로 평가하세요:
1. logic (논리성): 주장·근거·구조가 논리적인가
2. accuracy (정확성): 사실 관계·표현이 신뢰할 수 있는가
3. flow (문장 흐름): 단락·문장 연결이 자연스러운가
4. duplication (중복): 같은 표현·내용 반복이 없는가 (높을수록 좋음)
5. seo: 키워드 배치·검색 최적화
6. ctr (클릭률): 제목·도입부가 클릭을 유도하는가
7. readability (가독성): 읽기 쉽고 이해하기 쉬운가

issues 배열에 구체적인 문제점을 category, description, severity(low/medium/high)와 함께 나열하세요.
summary에는 전체 리뷰 요약을 한국어로 작성하세요.`;

export function buildReviewerInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
}): string {
  return `키워드: ${params.keyword}
제목: ${params.title}
메타디스크립션: ${params.metaDescription}

본문:
${params.content}

FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

해시태그: ${params.hashtags.join(", ")}`;
}

export const reviewerPrompts = {
  reviewerInstructions: withJsonOnly(reviewerInstructions),
  buildReviewerInput,
};
