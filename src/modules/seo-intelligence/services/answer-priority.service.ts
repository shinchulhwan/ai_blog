import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  answerPrioritySchema,
  type AnswerPriority,
  type RealSearchIntent,
} from "@/lib/schemas/seo-intelligence.schema";

export interface AnswerPriorityStepInput {
  keyword: string;
  researchContext: string;
  searchIntent: RealSearchIntent;
  customPrompt?: string;
}

export class AnswerPriorityService {
  async analyze(
    client: OpenAI,
    input: AnswerPriorityStepInput,
  ): Promise<AnswerPriority> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.answerPriorityInstructions,
        input: seoIntelligencePrompts.buildAnswerPriorityInput(
          input.keyword,
          input.researchContext,
          input.searchIntent,
          input.customPrompt,
        ),
      },
      answerPrioritySchema,
      "seo_answer_priority",
    );
  }
}

export const answerPriorityService = new AnswerPriorityService();
