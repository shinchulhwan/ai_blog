import {
  writingBrainQualityReviewSchema,
  type WritingBrainQualityReview,
} from "@/lib/schemas/writing-brain.schema";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class QualityReviewStep implements WritingBrainStep<WritingBrainQualityReview> {
  readonly stepId = "quality-review" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.draft) && Boolean(context.state.titleData);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<WritingBrainQualityReview> {
    const draft = context.state.draft!;
    const title = context.state.titleData!.selectedTitle;

    const review = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "quality-review",
      {
        keyword: input.keyword,
        title,
        content: draft.content,
        faq: JSON.stringify(draft.faq),
        hashtags: draft.hashtags.join(", "),
        metaDescription: draft.metaDescription,
        intent: JSON.stringify(context.state.intent, null, 2),
      },
      writingBrainQualityReviewSchema,
      "writing_brain_quality_review",
    );

    context.state.qualityReview = review;
    return review;
  }
}

export const qualityReviewStep = new QualityReviewStep();
