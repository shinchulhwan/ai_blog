import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import {
  imageResultToBlogAssets,
  type ImageResult,
} from "@/lib/schemas/image-result.schema";
import type { BodyDraft } from "@/modules/writer";
import type { FinalValidation } from "@/lib/schemas/writing-engine-v2.schema";
import type { ContentReview } from "@/modules/reviewer";
import type { TitleGenerationResult } from "@/modules/writer";

export function applyImageResultToDraft(
  draft: BodyDraft,
  imageResult: ImageResult,
): BodyDraft {
  return {
    ...draft,
    imageAssets: imageResultToBlogAssets(imageResult),
  };
}

export function buildBlogResultWithImages(params: {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review: ContentReview;
  validation: FinalValidation;
}): BlogFullResponse {
  const { titleData, draft, review, validation } = params;

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
      title: review.ctr,
      seo: review.seo,
      readability: review.readability,
      humanWriting: validation.criteria.humanWriting,
      duplicates: review.duplication,
    },
  };
}
