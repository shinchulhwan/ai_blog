import type { IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";
import type { ContentPlan } from "@/lib/schemas/writing-engine-v2.schema";
import type { SeoOptimizerOutput } from "@/lib/schemas/writing-engine-v2.schema";
import type { TitleGenerationResult } from "@/modules/writer";

export function buildTitleDataFromV2(
  keyword: string,
  researchContext: string,
  intent: IntentAnalysis,
  plan: ContentPlan,
  seoOutput: Pick<SeoOptimizerOutput, "titles" | "selectedTitle">,
): TitleGenerationResult {
  const sortedSections = [...plan.sections].sort(
    (a, b) => a.flowOrder - b.flowOrder,
  );

  return {
    researchContext,
    keywordAnalysis: {
      coreKeyword: keyword,
      relatedKeywords: [],
      searchTrend: "",
      competition: "",
      targetAudience: intent.targetAudience,
      summary: intent.summary,
    },
    titles: seoOutput.titles,
    selectedTitle: seoOutput.selectedTitle,
    searchIntent: {
      primaryIntent: intent.searchIntent,
      userGoal: intent.contentPurpose,
      userQuestions: intent.userQuestions,
      contentAngle: intent.contentAngle,
    },
    structure: {
      sections: sortedSections.map((section) => ({
        heading: section.heading,
        purpose: section.purpose,
        keyPoints: section.keyPoints,
      })),
    },
  };
}

export function buildTitleDataFromDraft(
  keyword: string,
  researchContext: string,
  intent: IntentAnalysis,
  plan: ContentPlan,
  selectedTitle: string,
): TitleGenerationResult {
  const titles = plan.suggestedTitles.length >= 10
    ? plan.suggestedTitles.slice(0, 10)
    : [
        ...plan.suggestedTitles,
        ...Array.from(
          { length: 10 - plan.suggestedTitles.length },
          (_, i) => `${selectedTitle} (${i + 1})`,
        ),
      ];

  return buildTitleDataFromV2(keyword, researchContext, intent, plan, {
    titles,
    selectedTitle,
  });
}
