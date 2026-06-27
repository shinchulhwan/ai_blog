import {
  writingBrainRewriteSchema,
  type WritingBrainRewrite,
} from "@/lib/schemas/writing-brain.schema";
import type { BodyDraft } from "@/modules/writer";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class RewriteStep implements WritingBrainStep<BodyDraft> {
  readonly stepId = "rewrite" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.draft) && Boolean(context.state.qualityReview);
  }

  async execute(input: WritingBrainInput, context: WritingBrainContext): Promise<BodyDraft> {
    const draft = context.state.draft!;
    const review = context.state.qualityReview!;
    const title = context.state.titleData!.selectedTitle;

    if (!review.needsRewrite && review.totalScore >= 80) {
      return draft;
    }

    const rewritten: WritingBrainRewrite = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "rewrite",
      {
        keyword: input.keyword,
        title,
        content: draft.content,
        faq: JSON.stringify(draft.faq),
        hashtags: draft.hashtags.join(", "),
        metaDescription: draft.metaDescription,
        reviewSummary: review.summary,
        reviewIssues: JSON.stringify(review.issues),
      },
      writingBrainRewriteSchema,
      "writing_brain_rewrite",
    );

    context.state.rewrite = rewritten;

    const updatedDraft: BodyDraft = {
      ...draft,
      content: rewritten.content,
      faq: rewritten.faq,
      hashtags: rewritten.hashtags,
      metaDescription: rewritten.metaDescription,
    };

    context.state.draft = updatedDraft;
    return updatedDraft;
  }
}

export const rewriteStep = new RewriteStep();
