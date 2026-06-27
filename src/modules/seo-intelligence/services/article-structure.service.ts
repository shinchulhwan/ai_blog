import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  seoArticleStructureSchema,
  type AnswerPriority,
  type PurchaseStage,
  type RealSearchIntent,
  type SeoArticleStructure,
} from "@/lib/schemas/seo-intelligence.schema";

export interface ArticleStructureStepInput {
  keyword: string;
  researchContext: string;
  searchIntent: RealSearchIntent;
  answerPriority: AnswerPriority;
  purchaseStage: PurchaseStage;
  customPrompt?: string;
}

export class ArticleStructureService {
  async generate(
    client: OpenAI,
    input: ArticleStructureStepInput,
  ): Promise<SeoArticleStructure> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.seoArticleStructureInstructions,
        input: seoIntelligencePrompts.buildSeoArticleStructureInput(
          input.keyword,
          input.researchContext,
          input.searchIntent,
          input.answerPriority,
          input.purchaseStage,
          input.customPrompt,
        ),
      },
      seoArticleStructureSchema,
      "seo_article_structure",
    );
  }
}

export const articleStructureService = new ArticleStructureService();
