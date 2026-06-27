import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  seoFaqGenerationSchema,
  type AnswerPriority,
  type PurchaseStage,
  type RealSearchIntent,
  type SeoFaqGeneration,
} from "@/lib/schemas/seo-intelligence.schema";

export interface FaqGenerationStepInput {
  keyword: string;
  researchContext: string;
  searchIntent: RealSearchIntent;
  answerPriority: AnswerPriority;
  purchaseStage: PurchaseStage;
  customPrompt?: string;
}

export class FaqGenerationService {
  async generate(
    client: OpenAI,
    input: FaqGenerationStepInput,
  ): Promise<SeoFaqGeneration> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.seoFaqGenerationInstructions,
        input: seoIntelligencePrompts.buildSeoFaqGenerationInput(
          input.keyword,
          input.researchContext,
          input.searchIntent,
          input.answerPriority,
          input.purchaseStage,
          input.customPrompt,
        ),
      },
      seoFaqGenerationSchema,
      "seo_faq_generation",
    );
  }
}

export const faqGenerationService = new FaqGenerationService();
