import { blogHistoryService } from "@/modules/history";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";

function buildBlogResult(context: WritingBrainContext): BlogFullResponse {
  const draft = context.state.draft!;
  const titleData = context.state.titleData!;
  const review = context.state.qualityReview!;
  const validation = context.state.validation!;

  return {
    titles: titleData.titles,
    selectedTitle: titleData.selectedTitle,
    metaDescription: draft.metaDescription,
    content: draft.content,
    faq: draft.faq,
    hashtags: draft.hashtags,
    ...draft.imageAssets,
    seoScore: validation.qualityScore,
    review: {
      title: review.seo,
      seo: review.seo,
      readability: review.readability,
      humanWriting: validation.criteria.humanWriting,
      duplicates: review.duplication,
    },
  };
}

export class HistorySaveStep implements WritingBrainStep<{ historyId: string }> {
  readonly stepId = "history" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.draft) && Boolean(context.state.validation);
  }

  async execute(
    input: WritingBrainInput,
    context: WritingBrainContext,
  ): Promise<{ historyId: string }> {
    const result = buildBlogResult(context);
    context.state.result = result;

    const record = await blogHistoryService.saveFromBlogResult(
      input.keyword,
      result,
      "READY",
      input.projectId,
    );

    context.state.historyId = record.id;
    return { historyId: record.id };
  }
}

export const historySaveStep = new HistorySaveStep();
