import { resolveBodyImageCountByLength } from "@/lib/schemas/blog-engine-v3.schema";
import { IMAGE_CONFIG } from "@/config/image.config";
import type { ImageMetadataInput } from "../providers/image-provider.types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-가-힣]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export interface ImageMetadataFields {
  coverPrompt: string;
  contentImages: string[];
  thumbnailText: string;
  altTexts: string[];
  fileNames: string[];
}

export function buildImageMetadataFields(input: ImageMetadataInput): ImageMetadataFields {
  const slug = slugify(input.keyword) || "blog-image";

  const coverPrompt =
    input.imagePrompt?.trim() ||
    `Professional blog hero image about "${input.title}", clean modern style, ` +
      `natural lighting, no text overlay, keyword: ${input.keyword}`;

  const bodyCount = Math.min(
    10,
    Math.max(
      2,
      Math.round(
        (resolveBodyImageCountByLength(input.content.length).min +
          resolveBodyImageCountByLength(input.content.length).max) /
          2,
      ),
    ),
  );

  const contentImages = Array.from({ length: bodyCount }, (_, index) => {
    return (
      `Blog section illustration #${index + 1} for "${input.title}", ` +
      `supporting visual, editorial style, keyword: ${input.keyword}`
    );
  });

  const thumbnailText =
    input.title.length > 28 ? `${input.title.slice(0, 26)}…` : input.title;

  const altTexts = [
    `${input.keyword} 대표 이미지 — ${input.title}`,
    ...contentImages.map((_, index) => `${input.keyword} 본문 이미지 ${index + 1}`),
  ];

  const fileNames = [
    `${slug}-cover.webp`,
    ...Array.from({ length: bodyCount }, (_, index) => `${slug}-body-${index + 1}.webp`),
  ];

  return {
    coverPrompt,
    contentImages,
    thumbnailText,
    altTexts,
    fileNames,
  };
}

export function buildMockImageUrls(input: ImageMetadataInput, fields: ImageMetadataFields) {
  const slug = slugify(input.keyword) || "blog-image";
  const base = IMAGE_CONFIG.mockBaseUrl;

  return {
    coverImageUrl: `${base}/${slug}/cover.webp`,
    contentImageUrls: fields.fileNames.slice(1).map(
      (fileName) => `${base}/${slug}/${fileName}`,
    ),
    thumbnailUrl: `${base}/${slug}/thumbnail.webp`,
  };
}
