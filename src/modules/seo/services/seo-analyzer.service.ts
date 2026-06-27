import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoAnalyzerPrompts } from "@/lib/prompts/seoAnalyzer";
import {
  seoAnalysisSchema,
  type SeoAnalysis,
} from "@/lib/schemas/quality-pipeline.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ContentReview } from "@/modules/reviewer";

export interface AnalyzeDraftInput {
  keyword: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review?: ContentReview;
}

export class SeoAnalyzerService {
  async analyzeDraft(client: OpenAI, input: AnalyzeDraftInput): Promise<SeoAnalysis> {
    return callStructuredJson(
      client,
      {
        instructions: seoAnalyzerPrompts.seoAnalyzerInstructions,
        input: seoAnalyzerPrompts.buildSeoAnalyzerInput({
          keyword: input.keyword,
          title: input.titleData.selectedTitle,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
          reviewSummary: input.review?.summary,
        }),
      },
      seoAnalysisSchema,
      "seo_analysis",
    );
  }
}

export const seoAnalyzerService = new SeoAnalyzerService();

/** @deprecated evaluateSeoStep 대체 */
export { evaluateSeoStep, SEO_PASSING_SCORE } from "@/modules/writer/services/writer-pipeline.steps";
