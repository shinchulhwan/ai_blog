import { formatResearchContext } from "@/modules/research";
import { writingBrainIntentSchema, type WritingBrainIntent } from "@/lib/schemas/writing-brain.schema";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class IntentAnalysisStep implements WritingBrainStep<WritingBrainIntent> {
  readonly stepId = "intent-analysis" as const;

  async validate(input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    void context;
    return Boolean(input.keyword.trim()) && Boolean(input.research.id);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<WritingBrainIntent> {
    const researchContext = formatResearchContext(input.research);

    const intent = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "intent-analysis",
      {
        keyword: input.keyword,
        researchContext,
        customPrompt: input.customPrompt ?? "",
      },
      writingBrainIntentSchema,
      "writing_brain_intent",
    );

    context.state.intent = intent;
    return intent;
  }
}

export const intentAnalysisStep = new IntentAnalysisStep();
