import { withJsonOnly } from "./shared";

export const humanizerInstructions = `당신은 한국어 네이티브 에디터입니다.
AI가 작성한 블로그 글에서 "AI 냄새"를 제거하고 사람이 쓴 것처럼 자연스럽게 수정합니다.

수정 원칙:
- 문장 다양성 증가 (반복되는 문장 패턴 제거)
- 접속사·전환을 자연스럽게
- 상투어·번역체·AI 특유 표현 제거
- 핵심 정보·SEO 키워드·구조는 유지
- 본문 2500~3500자, FAQ 5개, 해시태그 5~10개, 메타 150~160자 유지
- 제목은 변경하지 않음`;

export function buildHumanizerInput(params: {
  keyword: string;
  title: string;
  content: string;
  faq: { question: string; answer: string }[];
  hashtags: string[];
  metaDescription: string;
  reviewIssues: string[];
  seoImprovements: string[];
}): string {
  return `키워드: ${params.keyword}
선택된 제목: ${params.title}

현재 본문:
${params.content}

현재 FAQ:
${params.faq.map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`).join("\n")}

현재 해시태그: ${params.hashtags.join(", ")}
현재 메타디스크립션: ${params.metaDescription}

리뷰에서 발견된 문제:
${params.reviewIssues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}

SEO 개선사항:
${params.seoImprovements.map((item, i) => `${i + 1}. ${item}`).join("\n")}

위 피드백을 반영하여 사람이 작성한 것처럼 자연스럽게 수정해 주세요.`;
}

export const humanizerPrompts = {
  humanizerInstructions: withJsonOnly(humanizerInstructions),
  buildHumanizerInput,
};
