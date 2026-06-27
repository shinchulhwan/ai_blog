import {
  WRITING_BRAIN_PASSING_SCORE,
  writingBrainFinalValidationSchema,
  type WritingBrainFinalValidation,
} from "@/lib/schemas/writing-brain.schema";
import type { BodyDraft } from "@/modules/writer";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";
import { rewriteStep } from "./rewrite.step";

const MAX_VALIDATION_RETRIES = 2;

export class FinalValidationStep implements WritingBrainStep<WritingBrainFinalValidation> {
  readonly stepId = "final-validation" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.draft) && Boolean(context.state.qualityReview);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<WritingBrainFinalValidation> {
    let draft = context.state.draft!;
    const title = context.state.titleData!.selectedTitle;

    for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
      const validation = await this.validateDraft(
        input,
        context,
        draft,
        title,
      );

      if (validation.passed || validation.qualityScore >= WRITING_BRAIN_PASSING_SCORE) {
        context.state.validation = validation;
        return validation;
      }

      if (attempt >= MAX_VALIDATION_RETRIES) {
        context.state.validation = validation;
        return validation;
      }

      context.state.qualityReview = {
        ...context.state.qualityReview!,
        needsRewrite: true,
        summary: validation.summary,
        issues: validation.issues.map((issue) => ({
          category: "logic" as const,
          description: issue,
          severity: "high" as const,
          section: null,
        })),
      };

      draft = await rewriteStep.execute(input, context);
    }

    const validation = await this.validateDraft(input, context, draft, title);
    context.state.validation = validation;
    return validation;
  }

  private async validateDraft(
    input: WritingBrainInput,
    context: WritingBrainContext,
    draft: BodyDraft,
    title: string,
  ): Promise<WritingBrainFinalValidation> {
    return callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "final-validation",
      {
        keyword: input.keyword,
        title,
        content: draft.content,
        faq: JSON.stringify(draft.faq),
        hashtags: draft.hashtags.join(", "),
        metaDescription: draft.metaDescription,
        intent: JSON.stringify(context.state.intent, null, 2),
      },
      writingBrainFinalValidationSchema,
      "writing_brain_final_validation",
    );
  }
}

export const finalValidationStep = new FinalValidationStep();
