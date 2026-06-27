import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { reviewerPrompts } from "@/lib/prompts/reviewer";
import {
  contentReviewSchema,
  type ContentReview,
} from "@/lib/schemas/quality-pipeline.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";

export interface ReviewDraftInput {
  keyword: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
}

export class ReviewerService {
  async reviewDraft(client: OpenAI, input: ReviewDraftInput): Promise<ContentReview> {
    return callStructuredJson(
      client,
      {
        instructions: reviewerPrompts.reviewerInstructions,
        input: reviewerPrompts.buildReviewerInput({
          keyword: input.keyword,
          title: input.titleData.selectedTitle,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
        }),
      },
      contentReviewSchema,
      "content_review",
    );
  }
}

export const reviewerService = new ReviewerService();
