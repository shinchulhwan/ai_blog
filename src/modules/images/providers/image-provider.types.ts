import type { ImageResult } from "@/lib/schemas/image-result.schema";

export type ImageProviderType = "mock" | "openai";

export interface ImageMetadataInput {
  keyword: string;
  title: string;
  content: string;
  metaDescription: string;
  projectId: string;
  imagePrompt?: string;
}

export interface ImageGenerationInput {
  title: string;
  content: string;
  imagePrompt: string;
}

export interface ImageEngineExecuteResult {
  result: ImageResult;
  provider: ImageProviderType;
  usedFallback: boolean;
}

export interface ImageProvider {
  readonly type: ImageProviderType;
  generateCoverImage(input: ImageGenerationInput): Promise<string>;
  generateContentImages(
    input: ImageGenerationInput & { prompts: string[] },
  ): Promise<string[]>;
  generateThumbnail(input: ImageGenerationInput): Promise<string>;
  generateMetadata(input: ImageMetadataInput): Promise<ImageResult>;
}
