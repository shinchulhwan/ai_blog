import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { plannerPrompts } from "@/lib/prompts/planner";
import {
  contentPlanSchema,
  type ContentPlan,
  type IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import { formatResearchContext } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";

export interface PlanContentInput {
  keyword: string;
  research: ResearchRecord;
  intent: IntentAnalysis;
  customPrompt?: string;
}

export class ContentPlannerService {
  async planContent(
    client: OpenAI,
    input: PlanContentInput,
  ): Promise<ContentPlan> {
    const researchContext = formatResearchContext(input.research);

    return callStructuredJson(
      client,
      {
        instructions: plannerPrompts.contentPlannerInstructions,
        input: plannerPrompts.buildContentPlannerInput({
          keyword: input.keyword,
          researchContext,
          intent: input.intent,
          customPrompt: input.customPrompt,
        }),
      },
      contentPlanSchema,
      "content_plan",
    );
  }
}

export const contentPlannerService = new ContentPlannerService();
