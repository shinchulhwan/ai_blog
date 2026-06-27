import { z } from "zod";
import {
  BLOG_WRITING_STYLE_LABELS,
  DEFAULT_BLOG_WRITING_STYLE,
  type BlogWritingStyle,
} from "@/types/blog-style";

export const blogWritingStyleSchema = z.enum([
  "informational",
  "blog",
  "monetization",
  "review",
  "news",
]);

const STYLE_PROMPTS: Record<BlogWritingStyle, string> = {
  informational: `[글 스타일: 정보형]
- 객관적·중립적 톤으로 사실과 정보를 전달합니다.
- 정의 → 원리 → 활용 → 주의사항 순으로 논리적으로 전개합니다.
- 데이터, 수치, 비교 근거를 포함합니다 (없으면 일반적 사실 수준).
- 감정적 수사·과장·1인칭 경험담은 최소화합니다.
- H2 소제목은 정보 계층(개념, 방법, 비교, 팁)으로 구성합니다.
- 문단당 2~3문장, 모바일 가독성 유지.
- **중요 개념**은 굵게 표시합니다.`,

  blog: `[글 스타일: 블로그형]
- 친근하고 대화하듯 자연스러운 말투 (~해요, ~입니다 혼용 OK).
- 사람이 직접 블로그에 쓴 것처럼 작성합니다.
- 문단은 2~3문장, 문단 사이 빈 줄 필수.
- 도입부: 질문형 + 공감 문장으로 시작 (설명형 서두 금지).
- "직접 경험해 보면", "생각보다 어렵지 않습니다" 등 공감 표현 활용.
- AI 티 나는 표현(살펴보겠습니다, 결론적으로 등) 금지.
- 독자에게 말 걸듯 CTA로 마무리합니다.`,

  monetization: `[글 스타일: 수익형]
- 체류 시간 증가: H2마다 궁금증 유발 문장, 중간 요약, 스크롤 유도 훅 포함.
- SEO 최적화: 핵심·연관·롱테일 키워드를 H2·본문·FAQ에 자연 분산.
- CTA 강화: 본문 중간(soft) + 마무리(strong) 행동 유도 2회 이상.
- FAQ 3개 필수 — 검색 의도·구매/실행 직전 질문 중심.
- 번호 목록·체크리스트로 실행 가능한 액션 제시.
- 수익·효과·ROI 관련 포인트는 **굵게** 강조.
- 과장·낚시는 피하고, "꾸준히 하면", "직접 실천해 보세요" 등 현실적 CTA.`,

  review: `[글 스타일: 후기형]
- 1인칭 경험담 톤 ("직접 써 봤습니다", "한 달 써 보니").
- 장점·단점을 균형 있게, 솔직하게 서술합니다.
- 비교 대상·대안이 있으면 표 또는 Bullet로 정리합니다.
- 별점(5점 만점) 또는 "추천 대상 / 비추천 대상" 섹션 포함.
- 실사용 상황·기간·변화를 구체적으로 언급합니다.
- 광고성·과장 표현 금지, 독자에게 도움이 되는 솔직한 후기.
- 마무리: "이런 분께 추천합니다" 형태의 CTA.`,

  news: `[글 스타일: 뉴스형]
- 5W1H(누가, 무엇을, 언제, 어디서, 왜, 어떻게)를 본문에 반영합니다.
- 역피ramid: 핵심 사실을 도입부 첫 2~3문장에 배치합니다.
- 객관적·간결한 문장, 짧은 문단(1~2문장도 OK).
- "~것으로 알려졌다", "~라고 전했다" 등 뉴스 문체 (과도한 주관 금지).
- 배경·맥락 → 핵심 사실 → 영향·전망 순서.
- H2는 사건/배경/영향/전망 등 뉴스 섹션 구조.
- 감정적 수사·1인칭 후기 톤은 사용하지 않습니다.`,
};

export function resolveWritingStylePrompt(
  style: BlogWritingStyle = DEFAULT_BLOG_WRITING_STYLE,
): string {
  const label = BLOG_WRITING_STYLE_LABELS[style];
  const body = STYLE_PROMPTS[style];

  return `=== 선택된 글 스타일: ${label} ===\n${body}`;
}

export function parseWritingStyle(value: unknown): BlogWritingStyle {
  const parsed = blogWritingStyleSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_BLOG_WRITING_STYLE;
}
