import { withJsonOnly } from "./shared";
import type { IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";

export const seoOptimizerInstructions = `당신은 한국어 SEO 최적화 전문가입니다.
사람이 작성한 듯한 블로그 글을 검색 최적화합니다.

최적화 항목:
1. titles: CTR 높은 SEO 제목 후보 10개
2. selectedTitle: 최적 제목 1개 (키워드 포함, 25~40자)
3. content: 키워드 자연 삽입, H2 구조 유지, 2500~3500자
4. metaDescription: 150~160자, 키워드·클릭 유도
5. faq: FAQ 5개 SEO 최적화
6. hashtags: 5~10개
7. keywordNotes: 키워드 배치 전략 요약

키워드 스터핑 금지, 자연스러운 문장 유지.`;

export function buildSeoOptimizerInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
  intent: IntentAnalysis;
}): string {
  return `키워드: ${params.keyword}
현재 제목: ${params.title}

검색 의도:
${JSON.stringify(params.intent, null, 2)}

현재 본문:
${params.content}

현재 FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

현재 해시태그: ${params.hashtags.join(", ")}
현재 메타디스크립션: ${params.metaDescription}

위 콘텐츠를 SEO 관점에서 최적화해 주세요.`;
}

export const seoOptimizerPrompts = {
  seoOptimizerInstructions: withJsonOnly(seoOptimizerInstructions),
  buildSeoOptimizerInput,
};
