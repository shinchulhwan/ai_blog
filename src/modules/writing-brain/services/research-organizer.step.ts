import { formatResearchContext } from "@/modules/research";
import {
  writingBrainResearchSchema,
  type WritingBrainResearch,
} from "@/lib/schemas/writing-brain.schema";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class ResearchOrganizerStep implements WritingBrainStep<WritingBrainResearch> {
  readonly stepId = "research" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.intent);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<WritingBrainResearch> {
    const researchContext = formatResearchContext(input.research);

    const organized = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "research",
      {
        keyword: input.keyword,
        researchContext,
        intent: JSON.stringify(context.state.intent, null, 2),
        customPrompt: input.customPrompt ?? "",
      },
      writingBrainResearchSchema,
      "writing_brain_research",
    );

    context.state.organizedResearch = organized;
    return organized;
  }
}

export const researchOrganizerStep = new ResearchOrganizerStep();
