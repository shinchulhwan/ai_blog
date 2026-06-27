import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { validatorPrompts } from "@/lib/prompts/validator";
import {
  finalValidationSchema,
  validationRewriteSchema,
  VALIDATOR_PASSING_SCORE,
  MAX_VALIDATOR_RETRIES,
  type FinalValidation,
  type IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import type { BodyDraft } from "@/modules/writer";

export { VALIDATOR_PASSING_SCORE, MAX_VALIDATOR_RETRIES };

export interface ValidateFinalInput {
  keyword: string;
  title: string;
  draft: BodyDraft;
  intent: IntentAnalysis;
}

export interface FinalValidatorResult {
  validation: FinalValidation;
  draft: BodyDraft;
  rewriteAttempts: number;
}

export class FinalValidatorService {
  async validateAndFinalize(
    client: OpenAI,
    input: ValidateFinalInput,
    rewriteFn: (
      draft: BodyDraft,
      validation: FinalValidation,
    ) => Promise<BodyDraft>,
  ): Promise<FinalValidatorResult> {
    let draft = input.draft;
    let rewriteAttempts = 0;

    for (let attempt = 0; attempt <= MAX_VALIDATOR_RETRIES; attempt++) {
      const validation = await this.validate(client, {
        ...input,
        draft,
      });

      if (validation.passed || validation.qualityScore >= VALIDATOR_PASSING_SCORE) {
        return { validation, draft, rewriteAttempts };
      }

      if (attempt >= MAX_VALIDATOR_RETRIES) {
        return { validation, draft, rewriteAttempts };
      }

      draft = await rewriteFn(draft, validation);
      rewriteAttempts += 1;
    }

    const validation = await this.validate(client, { ...input, draft });
    return { validation, draft, rewriteAttempts };
  }

  async validate(
    client: OpenAI,
    input: ValidateFinalInput,
  ): Promise<FinalValidation> {
    return callStructuredJson(
      client,
      {
        instructions: validatorPrompts.finalValidatorInstructions,
        input: validatorPrompts.buildFinalValidatorInput({
          keyword: input.keyword,
          title: input.title,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
          intent: input.intent,
        }),
      },
      finalValidationSchema,
      "final_validation",
    );
  }

  async rewriteFromValidation(
    client: OpenAI,
    input: ValidateFinalInput,
    validation: FinalValidation,
  ): Promise<BodyDraft> {
    const revised = await callStructuredJson(
      client,
      {
        instructions: validatorPrompts.validationRewriteInstructions,
        input: validatorPrompts.buildValidationRewriteInput({
          keyword: input.keyword,
          title: input.title,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
          issues: validation.issues,
          summary: validation.summary,
        }),
      },
      validationRewriteSchema,
      "validation_rewrite",
    );

    return {
      ...input.draft,
      content: revised.content,
      faq: revised.faq,
      hashtags: revised.hashtags,
      metaDescription: revised.metaDescription,
    };
  }
}

export const finalValidatorService = new FinalValidatorService();
