import type { BlogHistoryRecord, HistoryImageAssets } from "@/types/history";
import type { PublishContent, PublishImages } from "../types";

function parseImageAssets(history: BlogHistoryRecord): PublishImages {
  if (history.imageAssets) {
    return {
      representative: {
        prompt: history.imageAssets.representativeImagePrompt,
        url: history.imageAssets.coverImageUrl ?? null,
        alt: history.imageAssets.altTags.representative,
        filename: history.imageAssets.imageFilenames.representative,
      },
      body: history.imageAssets.bodyImagePrompts.map((prompt, index) => ({
        prompt,
        url: history.imageAssets!.contentImageUrls?.[index] ?? null,
        alt: history.imageAssets!.altTags.body[index] ?? undefined,
        filename: history.imageAssets!.imageFilenames.body[index] ?? undefined,
      })),
      thumbnailText: history.imageAssets.thumbnailText,
      thumbnailUrl: history.imageAssets.thumbnailUrl ?? null,
    };
  }

  return {
    representative: {
      prompt: history.imagePrompt,
    },
    body: [],
  };
}

export function mapHistoryToPublishContent(history: BlogHistoryRecord): PublishContent {
  const images = parseImageAssets(history);

  return {
    historyId: history.id,
    keyword: history.keyword,
    title: history.selectedTitle,
    content: history.content,
    faq: history.faq,
    hashtags: history.hashtags,
    metaDescription: history.metaDescription,
    images,
    representativeImage: images.representative,
  };
}

export function mapBlogImagesToHistoryAssets(
  blog: import("@/lib/schemas/blog-response.schema").BlogFullResponse & {
    coverImageUrl?: string | null;
    contentImageUrls?: string[];
    thumbnailUrl?: string | null;
  },
): HistoryImageAssets {
  return {
    representativeImagePrompt: blog.representativeImagePrompt,
    bodyImagePrompts: blog.bodyImagePrompts,
    thumbnailText: blog.thumbnailText,
    altTags: blog.altTags,
    imageFilenames: blog.imageFilenames,
    coverImageUrl: blog.coverImageUrl ?? null,
    contentImageUrls: blog.contentImageUrls ?? [],
    thumbnailUrl: blog.thumbnailUrl ?? null,
  };
}
