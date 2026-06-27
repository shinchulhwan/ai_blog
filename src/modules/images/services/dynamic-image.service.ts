import { openAIImageProvider } from "../providers/openai.image-provider";
import { mockImageProvider } from "../providers/mock.image-provider";
import { resolveImageProviderType } from "../providers/image-provider.factory";
import type { ImageResult } from "@/lib/schemas/image-result.schema";
import type { ImageMetadataInput } from "../providers/image-provider.types";

export interface DynamicImageInput extends ImageMetadataInput {
  coverPrompt: string;
  bodyPrompts: string[];
  thumbnailText: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-가-힣]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function buildFileNames(keyword: string, count: number): string[] {
  const slug = slugify(keyword) || "blog-image";
  return [
    `${slug}-cover.jpg`,
    ...Array.from({ length: count }, (_, index) => `${slug}-body-${index + 1}.jpg`),
  ];
}

function buildAltTexts(keyword: string, title: string, count: number): string[] {
  return [
    `${keyword} 대표 이미지 — ${title}`,
    ...Array.from({ length: count }, (_, index) => `${keyword} 본문 이미지 ${index + 1}`),
  ];
}

export class DynamicImageService {
  async generate(input: DynamicImageInput): Promise<ImageResult> {
    const providerType = resolveImageProviderType();
    const bodyCount = Math.min(Math.max(input.bodyPrompts.length, 2), 10);
    const prompts = input.bodyPrompts.slice(0, bodyCount);
    const fileNames = buildFileNames(input.keyword, bodyCount);
    const altTexts = buildAltTexts(input.keyword, input.title, bodyCount);

    if (providerType === "mock") {
      const mock = await mockImageProvider.generateMetadata(input);
      return {
        coverPrompt: input.coverPrompt,
        contentImages: prompts,
        thumbnailText: input.thumbnailText,
        altTexts,
        fileNames,
        coverImageUrl: mock.coverImageUrl,
        contentImageUrls: prompts.map(
          (_, index) => mock.contentImageUrls[index] ?? mock.contentImageUrls[0]!,
        ),
        thumbnailUrl: mock.thumbnailUrl,
      };
    }

    const [coverImageUrl, contentImageUrls, thumbnailUrl] = await Promise.all([
      openAIImageProvider.generateCoverImage({
        title: input.title,
        content: input.content,
        imagePrompt: input.coverPrompt,
      }),
      openAIImageProvider.generateContentImages({
        title: input.title,
        content: input.content,
        imagePrompt: input.coverPrompt,
        prompts,
      }),
      openAIImageProvider.generateThumbnail({
        title: input.title,
        content: input.content,
        imagePrompt: input.thumbnailText,
      }),
    ]);

    return {
      coverPrompt: input.coverPrompt,
      contentImages: prompts,
      thumbnailText: input.thumbnailText,
      altTexts,
      fileNames,
      coverImageUrl,
      contentImageUrls,
      thumbnailUrl,
    };
  }
}

export const dynamicImageService = new DynamicImageService();
