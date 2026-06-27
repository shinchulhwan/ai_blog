import type { ImageProvider, ImageProviderType } from "./image-provider.types";
import { mockImageProvider } from "./mock.image-provider";
import { openAIImageProvider } from "./openai.image-provider";
import { AIProviderError } from "@/lib/errors";

function createForcedFailureImageProvider(): ImageProvider {
  const fail = async (): Promise<never> => {
    throw new AIProviderError("OPENAI_IMAGE_FORCE_FAIL");
  };

  return {
    type: "openai",
    generateCoverImage: fail,
    generateContentImages: fail,
    generateThumbnail: fail,
    generateMetadata: fail,
  };
}

function resolveProviderType(): ImageProviderType {
  const value = process.env.IMAGE_PROVIDER?.trim().toLowerCase() ?? "mock";

  if (value === "openai") {
    return "openai";
  }

  return "mock";
}

export function createImageProvider(type?: ImageProviderType): ImageProvider {
  const resolved = type ?? resolveProviderType();

  switch (resolved) {
    case "openai":
      if (process.env.OPENAI_IMAGE_FORCE_FAIL === "true") {
        return createForcedFailureImageProvider();
      }
      return openAIImageProvider;
    case "mock":
    default:
      return mockImageProvider;
  }
}

export function getAvailableImageProviders(): ImageProviderType[] {
  return ["mock", "openai"];
}

export function resolveImageProviderType(): ImageProviderType {
  return resolveProviderType();
}
