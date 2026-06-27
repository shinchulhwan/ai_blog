import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { researchPrompts } from "@/lib/prompts/research";
import {
  researchAiSchema,
  type ResearchAiResponse,
} from "@/lib/schemas/research.schema";
import type { ResearchConductResult, ResearchProvider } from "@/types/research";

function toConductResult(data: ResearchAiResponse): ResearchConductResult {
  return {
    intent: data.intent,
    relatedKeywords: data.relatedKeywords,
    questions: data.questions,
    outline: {
      coreTopic: data.coreTopic,
      searcherNeeds: data.searcherNeeds,
      sections: data.outline.sections,
    },
  };
}

export class OpenAIResearchProvider implements ResearchProvider {
  readonly type = "openai" as const;

  async conductResearch(keyword: string, client: OpenAI): Promise<ResearchConductResult> {
    const result = await callStructuredJson(
      client,
      {
        instructions: researchPrompts.researchInstructions,
        input: researchPrompts.buildResearchInput(keyword),
      },
      researchAiSchema,
      "keyword_research",
    );

    return toConductResult(result);
  }
}
