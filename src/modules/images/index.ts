export type { ImageResult } from "@/lib/schemas/image-result.schema";
export {
  imageResultSchema,
  imageResultToBlogAssets,
  imageResultToHistoryAssets,
} from "@/lib/schemas/image-result.schema";

export type {
  ImageProvider,
  ImageProviderType,
  ImageMetadataInput,
  ImageGenerationInput,
  ImageEngineExecuteResult,
} from "./providers/image-provider.types";

export { MockImageProvider, mockImageProvider } from "./providers/mock.image-provider";
export {
  OpenAIImageProvider,
  openAIImageProvider,
  OpenAiImageProvider,
  openAiImageProvider,
} from "./providers/openai.image-provider";
export {
  createImageProvider,
  getAvailableImageProviders,
  resolveImageProviderType,
} from "./providers/image-provider.factory";

export {
  ImageEngineService,
  imageEngineService,
} from "./services/image-engine.service";
export type { ImageEngineServiceInput } from "./services/image-engine.service";

export {
  buildImageMetadataFields,
  buildMockImageUrls,
} from "./services/image-metadata.builder";

export {
  applyImageResultToDraft,
  buildBlogResultWithImages,
} from "./services/image-result.mapper";
