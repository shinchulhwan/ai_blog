import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  ctaPlacementSchema,
  type CtaPlacement,
  type PurchaseStage,
  type SeoArticleStructure,
  type SeoTableOfContents,
} from "@/lib/schemas/seo-intelligence.schema";

export interface CtaPlacementStepInput {
  keyword: string;
  purchaseStage: PurchaseStage;
  articleStructure: SeoArticleStructure;
  tableOfContents: SeoTableOfContents;
  customPrompt?: string;
}

export class CtaPlacementService {
  async decide(
    client: OpenAI,
    input: CtaPlacementStepInput,
  ): Promise<CtaPlacement> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.ctaPlacementInstructions,
        input: seoIntelligencePrompts.buildCtaPlacementInput(
          input.keyword,
          input.purchaseStage,
          input.articleStructure,
          input.tableOfContents,
          input.customPrompt,
        ),
      },
      ctaPlacementSchema,
      "seo_cta_placement",
    );
  }
}

export const ctaPlacementService = new CtaPlacementService();
