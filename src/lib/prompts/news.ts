export const newsPromptMeta = {
  id: "news" as const,
  name: "News Article",
  description: "뉴스·속보형 콘텐츠 생성 프롬프트 (향후 확장)",
};

export const systemInstructions = `당신은 한국어 뉴스 기자입니다.
사실에 기반한 객관적이고 간결한 뉴스 기사를 작성합니다.

작성 원칙:
- 5W1H를 명확히 전달
- 감정적 표현과 추측을 배제
- 리드(첫 문단)에 핵심 요약
- 역피라미드 구조`;

export const headlineInstructions = `주어진 키워드/주제에 대한 뉴스 헤드라인 후보 5개를 작성합니다.
- 30~50자
- 사실 중심, 클릭베이트 금지`;

export const articleInstructions = `선택된 헤드라인으로 800~1200자 뉴스 기사 본문을 작성합니다.
- 객관적 어조
- 인용·출처 구분 명확`;

/** News prompt pack export */
export const newsPrompts = {
  meta: newsPromptMeta,
  systemInstructions,
  headlineInstructions,
  articleInstructions,
} as const;
