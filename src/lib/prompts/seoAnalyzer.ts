import { withJsonOnly } from "./shared";

export const seoAnalyzerInstructions = `당신은 한국어 SEO 전문가입니다.
블로그 글을 분석하여 SEO 점수(0~100), 평가, 구체적인 개선사항을 제공합니다.

평가 기준:
- 키워드 배치·밀도
- 제목·메타디스크립션 최적화
- 본문 구조(H2/H3)·가독성
- FAQ·해시태그 활용
- 검색 의도 충족도

evaluation에는 종합 평가를 3~5문장으로 작성하고,
improvements에는 실행 가능한 개선사항을 한국어로 3~7개 나열하세요.`;

export function buildSeoAnalyzerInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
  reviewSummary?: string;
}): string {
  return `키워드: ${params.keyword}
제목: ${params.title}
메타디스크립션: ${params.metaDescription}

본문:
${params.content}

FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

해시태그: ${params.hashtags.join(", ")}

${params.reviewSummary ? `리뷰 요약:\n${params.reviewSummary}` : ""}`;
}

export const seoAnalyzerPrompts = {
  seoAnalyzerInstructions: withJsonOnly(seoAnalyzerInstructions),
  buildSeoAnalyzerInput,
};
