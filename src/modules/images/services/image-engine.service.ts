import type { ImageResult } from "@/lib/schemas/image-result.schema";
import {
  createImageProvider,
  resolveImageProviderType,
} from "../providers/image-provider.factory";
import { mockImageProvider } from "../providers/mock.image-provider";
import type {
  ImageEngineExecuteResult,
  ImageMetadataInput,
} from "../providers/image-provider.types";

export type ImageEngineServiceInput = ImageMetadataInput;

export interface ImageEngineStep {
  validate(input: ImageEngineServiceInput): Promise<boolean>;
  execute(input: ImageEngineServiceInput): Promise<ImageEngineExecuteResult>;
}

export class ImageEngineService implements ImageEngineStep {
  async validate(input: ImageEngineServiceInput): Promise<boolean> {
    return (
      Boolean(input.keyword.trim()) &&
      Boolean(input.title.trim()) &&
      Boolean(input.content.trim()) &&
      Boolean(input.metaDescription.trim()) &&
      Boolean(input.projectId)
    );
  }

  async execute(input: ImageEngineServiceInput): Promise<ImageEngineExecuteResult> {
    const providerType = resolveImageProviderType();

    if (providerType === "mock") {
      const result = await mockImageProvider.generateMetadata(input);
      return { result, provider: "mock", usedFallback: false };
    }

    const provider = createImageProvider("openai");

    try {
      const result = await provider.generateMetadata(input);
      return { result, provider: "openai", usedFallback: false };
    } catch {
      const result = await mockImageProvider.generateMetadata(input);
      return { result, provider: "mock", usedFallback: true };
    }
  }
}

export const imageEngineService = new ImageEngineService();

/** @deprecated Use ImageEngineExecuteResult.result */
export type ImageEngineServiceResult = ImageResult;
