import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  purchaseStageSchema,
  type AnswerPriority,
  type PurchaseStage,
  type RealSearchIntent,
} from "@/lib/schemas/seo-intelligence.schema";

export interface PurchaseStageStepInput {
  keyword: string;
  researchContext: string;
  searchIntent: RealSearchIntent;
  answerPriority: AnswerPriority;
  customPrompt?: string;
}

export class PurchaseStageService {
  async analyze(
    client: OpenAI,
    input: PurchaseStageStepInput,
  ): Promise<PurchaseStage> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.purchaseStageInstructions,
        input: seoIntelligencePrompts.buildPurchaseStageInput(
          input.keyword,
          input.researchContext,
          input.searchIntent,
          input.answerPriority,
          input.customPrompt,
        ),
      },
      purchaseStageSchema,
      "seo_purchase_stage",
    );
  }
}

export const purchaseStageService = new PurchaseStageService();
