import type { ImageResult } from "@/lib/schemas/image-result.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { PublishPackage } from "../types/publish-package.types";

export function buildPublishPackage(params: {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  imageResult: ImageResult;
  version?: number;
}): PublishPackage {
  const now = new Date().toISOString();

  return {
    title: params.titleData.selectedTitle,
    metaDescription: params.draft.metaDescription,
    content: params.draft.content,
    faq: params.draft.faq,
    hashtags: params.draft.hashtags,
    images: {
      coverPrompt: params.imageResult.coverPrompt,
      contentImages: params.imageResult.contentImages,
      thumbnailText: params.imageResult.thumbnailText,
      altTexts: params.imageResult.altTexts,
      fileNames: params.imageResult.fileNames,
      coverImageUrl: params.imageResult.coverImageUrl,
      contentImageUrls: params.imageResult.contentImageUrls,
      thumbnailUrl: params.imageResult.thumbnailUrl,
    },
    createdAt: now,
    updatedAt: now,
    version: params.version ?? 1,
  };
}
