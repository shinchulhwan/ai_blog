/** Shared blog quality rules — used by prompts and post-processing. */

export const BLOG_FAQ_COUNT = 3;

export const BLOG_H2_SECTION_MIN = 5;
export const BLOG_H2_SECTION_MAX = 8;

export const BLOG_PARAGRAPH_MAX_SENTENCES = 3;

/** AI-style phrases to avoid (prompts + post-processor). */
export const BANNED_AI_PHRASES = [
  "본 글에서는",
  "살펴보겠습니다",
  "알아보겠습니다",
  "제공합니다",
  "중요한 요소입니다",
  "도움이 될 것입니다",
  "결론적으로",
  "정리하자면",
  "마지막으로 말씀드리면",
  "이번 글에서는",
  "함께 알아보겠습니다",
] as const;

/** Natural tone examples for prompts. */
export const NATURAL_TONE_EXAMPLES = [
  "~해볼 수 있습니다.",
  "~하는 경우가 많습니다.",
  "실제로 많이 활용됩니다.",
  "직접 경험해 보면",
  "생각보다 어렵지 않습니다.",
  "꼭 알아두면 좋습니다.",
  "이런 점도 있습니다.",
  "~인 경우가 많아요.",
  "~해 보시면 좋아요.",
] as const;

export const BLOG_STRUCTURE_TEMPLATE = `
## 필수 본문 구조 (마크다운, # H1은 본문에 넣지 않음)

1. **도입부** (2~4문장, 질문·공감·궁금증으로 시작 — 설명형 서두 금지)
2. **H2 소제목 ${BLOG_H2_SECTION_MIN}~${BLOG_H2_SECTION_MAX}개** — 각 섹션마다 2~4개의 짧은 문단
3. **번호 목록** 1회 이상 (1. 2. 3.)
4. **Bullet 목록** 1회 이상 (- 또는 *)
5. **체크리스트** 1회 이상 (- [ ] 또는 - [x]) — 가능한 경우
6. **마무리 요약** (2~3문장)
7. **CTA** (독자 행동 유도 1~2문장)
8. **## 자주 묻는 질문** — FAQ ${BLOG_FAQ_COUNT}개 (### 질문 + 짧은 답변)
`.trim();

export const PARAGRAPH_RULES = `
문단 규칙:
- 한 문단은 최대 ${BLOG_PARAGRAPH_MAX_SENTENCES}문장
- 문단 사이 빈 줄(\\n\\n) 필수 — 모바일 가독성
- 같은 어미(~합니다, ~가능합니다, ~제공합니다) 3회 이상 연속 금지
- 중요 문장은 **굵게** 표시
`.trim();

export const SEO_KEYWORD_RULES = `
SEO 키워드 규칙:
- 핵심 키워드: 도입부·H2·마무리에 자연스럽게 1회씩
- 연관 키워드·롱테일 키워드: 본문 전체에 고르게 분산
- 키워드만 반복하는 문장 금지 (키워드 스터핑 금지)
`.trim();

export const INTRO_RULES = `
도입부 규칙:
- 처음부터 정의·설명하지 말 것
- 질문, 공감, 궁금증으로 시작
- 예: "AI로 정말 블로그 수익을 낼 수 있을까요?"
- 예: "요즘 AI를 활용한 블로그 운영에 관심 있는 분들이 많습니다."
`.trim();

export const CTA_EXAMPLES = [
  "오늘부터 하나씩 직접 실천해 보세요.",
  "꾸준히 운영하면 분명 좋은 결과를 얻을 수 있습니다.",
  "지금 바로 작은 것부터 시작해 보세요.",
  "직접 적용해 보면서 나만의 방법을 찾아보세요.",
] as const;
