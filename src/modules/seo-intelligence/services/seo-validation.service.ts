import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  seoIntelligenceValidationSchema,
  type SeoIntelligenceResult,
  type SeoIntelligenceValidation,
} from "@/lib/schemas/seo-intelligence.schema";

export interface SeoValidationStepInput {
  keyword: string;
  result: Omit<SeoIntelligenceResult, "validation">;
}

export class SeoValidationService {
  async validate(
    client: OpenAI,
    input: SeoValidationStepInput,
  ): Promise<SeoIntelligenceValidation> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.seoIntelligenceValidationInstructions,
        input: seoIntelligencePrompts.buildSeoIntelligenceValidationInput(
          input.keyword,
          input.result,
        ),
      },
      seoIntelligenceValidationSchema,
      "seo_intelligence_validation",
    );
  }
}

export const seoValidationService = new SeoValidationService();
