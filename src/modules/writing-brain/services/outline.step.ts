import {
  writingBrainOutlineSchema,
  type WritingBrainOutline,
} from "@/lib/schemas/writing-brain.schema";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class OutlineStep implements WritingBrainStep<WritingBrainOutline> {
  readonly stepId = "outline" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.intent) && Boolean(context.state.organizedResearch);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<WritingBrainOutline> {
    const outline = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "outline",
      {
        keyword: input.keyword,
        intent: JSON.stringify(context.state.intent, null, 2),
        organizedResearch: JSON.stringify(context.state.organizedResearch, null, 2),
        customPrompt: input.customPrompt ?? "",
      },
      writingBrainOutlineSchema,
      "writing_brain_outline",
    );

    context.state.outline = outline;
    return outline;
  }
}

export const outlineStep = new OutlineStep();
