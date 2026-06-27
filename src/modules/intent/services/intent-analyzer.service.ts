import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { intentPrompts } from "@/lib/prompts/intent";
import {
  intentAnalysisSchema,
  type IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import { formatResearchContext } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";

export interface AnalyzeIntentInput {
  keyword: string;
  research: ResearchRecord;
  customPrompt?: string;
}

export class IntentAnalyzerService {
  async analyzeIntent(
    client: OpenAI,
    input: AnalyzeIntentInput,
  ): Promise<IntentAnalysis> {
    const researchContext = formatResearchContext(input.research);

    return callStructuredJson(
      client,
      {
        instructions: intentPrompts.intentAnalyzerInstructions,
        input: intentPrompts.buildIntentAnalyzerInput({
          keyword: input.keyword,
          researchContext,
          customPrompt: input.customPrompt,
        }),
      },
      intentAnalysisSchema,
      "intent_analysis",
    );
  }
}

export const intentAnalyzerService = new IntentAnalyzerService();
