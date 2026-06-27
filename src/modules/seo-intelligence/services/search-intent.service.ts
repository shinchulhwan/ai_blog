import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  realSearchIntentSchema,
  type RealSearchIntent,
} from "@/lib/schemas/seo-intelligence.schema";

export interface SearchIntentStepInput {
  keyword: string;
  researchContext: string;
  customPrompt?: string;
}

export class SearchIntentService {
  async analyze(
    client: OpenAI,
    input: SearchIntentStepInput,
  ): Promise<RealSearchIntent> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.realSearchIntentInstructions,
        input: seoIntelligencePrompts.buildRealSearchIntentInput(
          input.keyword,
          input.researchContext,
          input.customPrompt,
        ),
      },
      realSearchIntentSchema,
      "seo_real_search_intent",
    );
  }
}

export const searchIntentService = new SearchIntentService();
