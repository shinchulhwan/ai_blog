import type { WritingBrainPromptStep } from "@/modules/prompt/repository/prompt.repository";
import {
  BLOG_FAQ_COUNT,
  BLOG_H2_SECTION_MAX,
  BLOG_H2_SECTION_MIN,
  BANNED_AI_PHRASES,
  BLOG_STRUCTURE_TEMPLATE,
  CTA_EXAMPLES,
  INTRO_RULES,
  NATURAL_TONE_EXAMPLES,
  PARAGRAPH_RULES,
  SEO_KEYWORD_RULES,
} from "@/lib/markdown/blog-content-guidelines";

const BANNED_LIST = BANNED_AI_PHRASES.map((phrase) => `- "${phrase}"`).join("\n");
const TONE_LIST = NATURAL_TONE_EXAMPLES.map((example) => `- ${example}`).join("\n");
const CTA_LIST = CTA_EXAMPLES.map((example) => `- "${example}"`).join("\n");

const SHARED_QUALITY_RULES = `
${PARAGRAPH_RULES}

${SEO_KEYWORD_RULES}

자연스러운 말투 예시:
${TONE_LIST}

금지 표현 (절대 사용 금지):
${BANNED_LIST}
`.trim();

const STEP_EXTENSIONS: Partial<Record<WritingBrainPromptStep, string>> = {
  outline: `
목차(outline) 작성 규칙:
- H2 섹션 ${BLOG_H2_SECTION_MIN}~${BLOG_H2_SECTION_MAX}개
- 도입부·번호 목록·Bullet·체크리스트·마무리·CTA·FAQ 섹션을 narrativeFlow에 반영
- faqPlan: 정확히 ${BLOG_FAQ_COUNT}개
${INTRO_RULES}
`.trim(),

  draft: `
${BLOG_STRUCTURE_TEMPLATE}

${SHARED_QUALITY_RULES}

${INTRO_RULES}

본문 작성 추가 규칙:
- 도입부: 질문·공감·궁금증으로 시작 (정의/설명형 서두 금지)
- 각 H2 아래 2~4개의 짧은 문단 (문단당 최대 3문장)
- 번호 목록, Bullet, 체크리스트 각 1회 이상 포함
- 중요 문장 **굵게** 표시
- 마무리: 요약 + CTA (행동 유도)
- 본문 마지막에 "## 자주 묻는 질문" + FAQ ${BLOG_FAQ_COUNT}개 포함
- faq JSON 필드에도 동일 ${BLOG_FAQ_COUNT}개 작성

CTA 예시:
${CTA_LIST}
`.trim(),

  "quality-review": `
품질 검토 시 아래를 엄격히 확인:
- 문단당 3문장 이하인가
- AI 금지 표현이 있는가
- ~합니다/~가능합니다/~제공합니다 반복인가
- 도입부가 질문·공감으로 시작하는가
- H2가 ${BLOG_H2_SECTION_MIN}개 이상인가
- 리스트(번호/Bullet/체크)가 포함되었는가
- FAQ ${BLOG_FAQ_COUNT}개와 CTA가 있는가
`.trim(),

  rewrite: `
재작성 시 반드시 적용:
${BLOG_STRUCTURE_TEMPLATE}
${SHARED_QUALITY_RULES}
${INTRO_RULES}

문제가 있는 문단만 고치지 말고, 전체 톤과 문단 길이를 사람이 쓴 블로그처럼 다듬으세요.
`.trim(),

  "final-validation": `
최종 검증 기준:
- humanWriting: AI 티, 금지 표현, 반복 어미 점검
- readability: 문단 길이(3문장 이하), 모바일 가독성, 리스트 활용
- seo: 키워드 자연 분산 (스터핑 없음)
- FAQ ${BLOG_FAQ_COUNT}개, CTA 포함 여부
`.trim(),
};

export function getWritingBrainStepExtensions(step: WritingBrainPromptStep): string {
  return STEP_EXTENSIONS[step] ?? "";
}
