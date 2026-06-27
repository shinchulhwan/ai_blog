import { z } from "zod";

export const imageResultSchema = z.object({
  coverPrompt: z.string().min(1),
  contentImages: z.array(z.string().min(1)).min(2).max(10),
  thumbnailText: z.string().min(1),
  altTexts: z.array(z.string().min(1)).min(3).max(11),
  fileNames: z.array(z.string().min(1)).min(3).max(11),
  coverImageUrl: z.string().min(1),
  contentImageUrls: z.array(z.string().min(1)).min(2).max(10),
  thumbnailUrl: z.string().min(1),
});

export type ImageResult = z.infer<typeof imageResultSchema>;

export function imageResultToBlogAssets(result: ImageResult) {
  const bodyCount = result.contentImages.length;

  return {
    representativeImagePrompt: result.coverPrompt,
    bodyImagePrompts: result.contentImages,
    thumbnailText: result.thumbnailText,
    altTags: {
      representative: result.altTexts[0] ?? "",
      body: result.altTexts.slice(1, 1 + bodyCount),
    },
    imageFilenames: {
      representative: result.fileNames[0] ?? "",
      body: result.fileNames.slice(1, 1 + bodyCount),
    },
    coverImageUrl: result.coverImageUrl,
    contentImageUrls: result.contentImageUrls,
    thumbnailUrl: result.thumbnailUrl,
  };
}

export function imageResultToHistoryAssets(result: ImageResult) {
  const assets = imageResultToBlogAssets(result);
  return {
    representativeImagePrompt: assets.representativeImagePrompt,
    bodyImagePrompts: assets.bodyImagePrompts,
    thumbnailText: assets.thumbnailText,
    altTags: assets.altTags,
    imageFilenames: assets.imageFilenames,
    coverImageUrl: assets.coverImageUrl,
    contentImageUrls: assets.contentImageUrls,
    thumbnailUrl: assets.thumbnailUrl,
  };
}
