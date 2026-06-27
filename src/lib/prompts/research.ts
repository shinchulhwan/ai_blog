import { withJsonOnly } from "./shared";

export const researchPromptMeta = {
  id: "research" as const,
  name: "AI Research",
  description: "블로그 작성 전 키워드 리서치 프롬프트",
};

export const researchInstructions = `당신은 한국어 SEO 콘텐츠 리서치 전문가입니다.
블로그 글 작성 전 키워드에 대한 심층 리서치를 수행합니다.

다음 항목을 반드시 수행하세요:

1. 키워드 검색 의도 분석 (intent)
   - 정보형/탐색형/거래형 등 주요 검색 의도
   - 사용자가 검색하는 상황과 목적
   - 3~5문장의 상세 분석 (한국어)

2. 핵심 주제 추출 (coreTopic)
   - 키워드의 핵심 주제를 한 문장으로 명확히 정의

3. 연관 키워드 20개 (relatedKeywords)
   - SEO에 활용 가능한 연관 키워드 정확히 20개
   - 중복 없이 다양한 롱테일 포함

4. 사람들이 궁금해하는 질문 20개 (questions)
   - 실제 검색 사용자가 궁금해할 자연스러운 한국어 질문 20개
   - FAQ·본문 구성에 활용 가능

5. 검색자가 원하는 정보 분석 (searcherNeeds)
   - 검색자가 기대하는 정보 유형과 깊이
   - 어떤 답변을 원하는지 3~5문장으로 설명

6. 글 아웃라인 (outline.sections)
   - coreTopic과 searcherNeeds를 반영한 H2 수준 섹션 3~6개
   - 각 섹션: heading, purpose, keyPoints(3~5개)`;

export const buildResearchInput = (keyword: string) =>
  `다음 키워드에 대한 블로그 작성 전 리서치를 수행해 주세요.\n\n키워드: ${keyword.trim()}`;

export const researchPrompts = {
  meta: researchPromptMeta,
  researchInstructions: withJsonOnly(researchInstructions),
  buildResearchInput,
};
