import type { ImageResult } from "@/lib/schemas/image-result.schema";
import {
  buildImageMetadataFields,
  buildMockImageUrls,
} from "../services/image-metadata.builder";
import type {
  ImageGenerationInput,
  ImageMetadataInput,
  ImageProvider,
} from "./image-provider.types";

function toMetadataInput(input: ImageGenerationInput, keyword?: string): ImageMetadataInput {
  return {
    keyword: keyword ?? input.title,
    title: input.title,
    content: input.content,
    metaDescription: input.content.slice(0, 120),
    projectId: "mock",
    imagePrompt: input.imagePrompt,
  };
}

export class MockImageProvider implements ImageProvider {
  readonly type = "mock" as const;

  async generateCoverImage(input: ImageGenerationInput): Promise<string> {
    const metadataInput = toMetadataInput(input);
    const fields = buildImageMetadataFields(metadataInput);
    return buildMockImageUrls(metadataInput, fields).coverImageUrl;
  }

  async generateContentImages(
    input: ImageGenerationInput & { prompts: string[] },
  ): Promise<string[]> {
    const metadataInput = toMetadataInput(input);
    const fields = buildImageMetadataFields(metadataInput);
    return buildMockImageUrls(metadataInput, {
      ...fields,
      contentImages: input.prompts,
    }).contentImageUrls;
  }

  async generateThumbnail(input: ImageGenerationInput): Promise<string> {
    const metadataInput = toMetadataInput(input);
    const fields = buildImageMetadataFields(metadataInput);
    return buildMockImageUrls(metadataInput, fields).thumbnailUrl;
  }

  async generateMetadata(input: ImageMetadataInput): Promise<ImageResult> {
    const fields = buildImageMetadataFields(input);
    const urls = buildMockImageUrls(input, fields);

    return {
      ...fields,
      ...urls,
    };
  }
}

export const mockImageProvider = new MockImageProvider();
