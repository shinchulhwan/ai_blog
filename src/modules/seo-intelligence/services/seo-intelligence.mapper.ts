import type {
  ContentPlan,
  IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";

export function mapSeoIntelligenceToIntent(
  result: SeoIntelligenceResult,
): IntentAnalysis {
  return {
    searchIntent: `${result.searchIntent.primaryIntent} — ${result.searchIntent.underlyingNeed}`,
    targetAudience: result.purchaseStage.readerMindset,
    contentPurpose: result.purchaseStage.contentFocus,
    userQuestions: result.answerPriority.priorities.map((p) => p.question),
    contentAngle: result.searchIntent.searchContext,
    summary: result.searchIntent.summary,
  };
}

export function mapSeoIntelligenceToPlan(
  result: SeoIntelligenceResult,
): ContentPlan {
  const sortedSections = [...result.articleStructure.sections].sort(
    (a, b) => a.flowOrder - b.flowOrder,
  );

  return {
    sections: sortedSections.map((section) => ({
      heading: section.heading,
      purpose: section.purpose,
      keyPoints: section.keyPoints,
      flowOrder: section.flowOrder,
    })),
    narrativeFlow: result.articleStructure.narrativeFlow,
    faqPlan: result.faq.faq.map((item) => ({
      question: item.question,
      answerOutline: item.answer,
    })),
    suggestedTitles: result.titleCandidates.titles,
    estimatedTone: result.purchaseStage.stageLabel,
  };
}

export function mapSeoIntelligenceToWriterContext(
  result: SeoIntelligenceResult,
): {
  intent: IntentAnalysis;
  plan: ContentPlan;
  selectedTitle: string;
  seoBrief: SeoIntelligenceResult;
} {
  return {
    intent: mapSeoIntelligenceToIntent(result),
    plan: mapSeoIntelligenceToPlan(result),
    selectedTitle: result.titleCandidates.selectedTitle,
    seoBrief: result,
  };
}
