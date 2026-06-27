function repeatText(text: string, minLength: number, maxLength = 4000): string {
  let result = text;

  while (result.length < minLength) {
    result += text;
  }

  return result.slice(0, maxLength);
}

function keywordList(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
}

const META_DESCRIPTION = repeatText(
  "테스트 키워드 SEO 가이드입니다. 검색 의도에 맞는 실용 정보를 제공합니다. ",
  90,
  150,
);

const BLOG_CONTENT = repeatText(
  "이 글은 통합 테스트용 본문입니다. 한국어 SEO 블로그 품질 기준을 충족합니다. ",
  2600,
  3200,
);

const FAQ_ITEMS = Array.from({ length: 5 }, (_, index) => ({
  question: `테스트 FAQ 질문 ${index + 1}은 무엇인가요?`,
  answer: `테스트 FAQ 답변 ${index + 1}입니다. 실제 운영 데이터가 아닌 통합 테스트용 응답입니다.`,
}));

export function buildResearchFixture() {
  return {
    intent: "정보 탐색",
    coreTopic: "통합 테스트 키워드",
    relatedKeywords: keywordList("연관키워드", 20),
    questions: keywordList("질문", 20),
    searcherNeeds: "테스트 키워드에 대한 기본 정보와 실용 팁",
    outline: {
      sections: [
        {
          heading: "개요",
          purpose: "주제 소개",
          keyPoints: ["핵심 개념", "배경 설명"],
        },
        {
          heading: "핵심 내용",
          purpose: "상세 설명",
          keyPoints: ["방법 1", "방법 2"],
        },
        {
          heading: "실전 팁",
          purpose: "적용 방법",
          keyPoints: ["팁 A", "팁 B"],
        },
      ],
    },
  };
}

export function buildDecisionFixture() {
  return {
    verdict: "GO" as const,
    verdictReason: "통합 테스트용 GO 판정",
    analysis: {
      worthWriting: { score: 85, reason: "테스트 가치 충분" },
      searchIntent: "정보형",
      competition: { level: "medium" as const, reason: "경쟁 보통" },
      blogTrafficPotential: { possible: true, reason: "트래픽 가능" },
      adValue: { level: "medium" as const, reason: "광고 가치 보통" },
      profitability: { level: "medium" as const, reason: "수익성 보통" },
      historyDuplicate: {
        isDuplicate: false,
        matchedHistoryId: null,
        reason: "중복 없음",
      },
      summary: "통합 테스트 진행 가능",
    },
  };
}

export function buildWritingBrainIntentFixture() {
  return {
    searchIntent: "정보 탐색",
    targetAudience: "초보 사용자",
    contentPurpose: "실용 가이드 제공",
    userQuestions: ["무엇인가요?", "어떻게 하나요?", "왜 필요한가요?"],
    contentAngle: "실전 중심",
    summary: "테스트 의도 분석 요약",
  };
}

export function buildWritingBrainResearchFixture() {
  return {
    coreTopic: "통합 테스트 주제",
    keyFacts: keywordList("사실", 5),
    relatedKeywords: keywordList("관련", 5),
    userQuestions: ["질문1", "질문2", "질문3"],
    summary: "정리된 리서치 요약",
  };
}

export function buildWritingBrainOutlineFixture() {
  return {
    selectedTitle: "통합 테스트 키워드 완벽 가이드",
    titleCandidates: keywordList("제목후보", 5),
    sections: [
      {
        heading: "소개",
        purpose: "주제 소개",
        keyPoints: ["배경", "중요성"],
        flowOrder: 1,
      },
      {
        heading: "핵심 개념",
        purpose: "개념 설명",
        keyPoints: ["정의", "특징"],
        flowOrder: 2,
      },
      {
        heading: "실전 방법",
        purpose: "적용법",
        keyPoints: ["단계1", "단계2"],
        flowOrder: 3,
      },
      {
        heading: "마무리",
        purpose: "정리",
        keyPoints: ["요약", "다음 행동"],
        flowOrder: 4,
      },
    ],
    tableOfContents: [
      { order: 1, heading: "소개", dwellHook: "왜 중요한가" },
      { order: 2, heading: "핵심 개념", dwellHook: "반드시 알아야 할 점" },
      { order: 3, heading: "실전 방법", dwellHook: "바로 적용하기" },
      { order: 4, heading: "마무리", dwellHook: "핵심 정리" },
    ],
    narrativeFlow: "문제 제기 후 해결책 제시",
    faqPlan: Array.from({ length: 5 }, (_, index) => ({
      question: `FAQ 계획 ${index + 1}`,
      answerOutline: `FAQ 답변 개요 ${index + 1}`,
    })),
  };
}

export function buildWritingBrainDraftFixture() {
  return {
    content: BLOG_CONTENT,
    faq: FAQ_ITEMS,
    hashtags: ["#테스트", "#통합", "#SEO", "#블로그", "#가이드"],
    metaDescription: META_DESCRIPTION,
  };
}

export function buildWritingBrainQualityReviewFixture() {
  return {
    logic: 18,
    readability: 18,
    duplication: 19,
    flow: 18,
    seo: 17,
    totalScore: 90,
    issues: [
      {
        category: "seo" as const,
        description: "경미한 SEO 개선 여지",
        severity: "low" as const,
        section: null,
      },
    ],
    summary: "전반적으로 양호",
    needsRewrite: false,
  };
}

export function buildWritingBrainFinalValidationFixture() {
  return {
    qualityScore: 98,
    passed: true,
    criteria: {
      intentAlignment: 20,
      contentQuality: 20,
      readability: 19,
      seo: 19,
      humanWriting: 20,
    },
    issues: ["경미한 문장 다듬기 권장"],
    summary: "발행 가능 품질",
    needsRewrite: false,
  };
}

export function buildWritingBrainRewriteFixture() {
  const draft = buildWritingBrainDraftFixture();

  return {
    ...draft,
    rewrittenSections: ["소개", "핵심 개념"],
  };
}

export function buildSuccessFixtureQueue(): unknown[] {
  return [
    buildResearchFixture(),
    buildDecisionFixture(),
    buildWritingBrainIntentFixture(),
    buildWritingBrainResearchFixture(),
    buildWritingBrainOutlineFixture(),
    buildWritingBrainDraftFixture(),
    buildWritingBrainQualityReviewFixture(),
    buildWritingBrainFinalValidationFixture(),
  ];
}
