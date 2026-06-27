import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  seoTitleCandidatesSchema,
  type PurchaseStage,
  type RealSearchIntent,
  type SeoArticleStructure,
  type SeoTitleCandidates,
} from "@/lib/schemas/seo-intelligence.schema";

export interface TitleCandidatesStepInput {
  keyword: string;
  researchContext: string;
  searchIntent: RealSearchIntent;
  purchaseStage: PurchaseStage;
  articleStructure: SeoArticleStructure;
  customPrompt?: string;
}

export class TitleCandidatesService {
  async generate(
    client: OpenAI,
    input: TitleCandidatesStepInput,
  ): Promise<SeoTitleCandidates> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.seoTitleCandidatesInstructions,
        input: seoIntelligencePrompts.buildSeoTitleCandidatesInput(
          input.keyword,
          input.researchContext,
          input.searchIntent,
          input.purchaseStage,
          input.articleStructure,
          input.customPrompt,
        ),
      },
      seoTitleCandidatesSchema,
      "seo_title_candidates",
    );
  }
}

export const titleCandidatesService = new TitleCandidatesService();
