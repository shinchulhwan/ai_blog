import OpenAI from "openai";
import { AIProviderError } from "@/lib/errors";
import { getOpenAIClient } from "@/lib/openai/client";
import { IMAGE_CONFIG } from "@/config/image.config";
import type { ImageResult } from "@/lib/schemas/image-result.schema";
import { buildImageMetadataFields } from "../services/image-metadata.builder";
import type {
  ImageGenerationInput,
  ImageMetadataInput,
  ImageProvider,
} from "./image-provider.types";

function extractImageUrl(image: OpenAI.Images.Image): string {
  if (image.url) {
    return image.url;
  }

  if (image.b64_json) {
    return `data:image/png;base64,${image.b64_json}`;
  }

  throw new AIProviderError("OpenAI Images API가 이미지 데이터를 반환하지 않았습니다.");
}

export class OpenAIImageProvider implements ImageProvider {
  readonly type = "openai" as const;

  private async generateImage(prompt: string, size: string): Promise<string> {
    const client = getOpenAIClient();
    const response = await client.images.generate({
      model: IMAGE_CONFIG.openai.model,
      prompt,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: IMAGE_CONFIG.openai.quality,
      n: 1,
    });

    const image = response.data?.[0];

    if (!image) {
      throw new AIProviderError("OpenAI Images API 응답이 비어 있습니다.");
    }

    return extractImageUrl(image);
  }

  async generateCoverImage(input: ImageGenerationInput): Promise<string> {
    return this.generateImage(input.imagePrompt, IMAGE_CONFIG.openai.coverSize);
  }

  async generateContentImages(
    input: ImageGenerationInput & { prompts: string[] },
  ): Promise<string[]> {
    const urls: string[] = [];

    for (const prompt of input.prompts) {
      urls.push(await this.generateImage(prompt, IMAGE_CONFIG.openai.contentSize));
    }

    return urls;
  }

  async generateThumbnail(input: ImageGenerationInput): Promise<string> {
    const prompt =
      `Minimal blog thumbnail graphic for "${input.title}", bold typography, ` +
      `clean layout, no watermark, keyword context: ${input.imagePrompt.slice(0, 120)}`;

    return this.generateImage(prompt, IMAGE_CONFIG.openai.thumbnailSize);
  }

  async generateMetadata(input: ImageMetadataInput): Promise<ImageResult> {
    const fields = buildImageMetadataFields(input);
    const coverPrompt = input.imagePrompt?.trim() || fields.coverPrompt;

    const [coverImageUrl, contentImageUrls, thumbnailUrl] = await Promise.all([
      this.generateCoverImage({
        title: input.title,
        content: input.content,
        imagePrompt: coverPrompt,
      }),
      this.generateContentImages({
        title: input.title,
        content: input.content,
        imagePrompt: coverPrompt,
        prompts: fields.contentImages,
      }),
      this.generateThumbnail({
        title: input.title,
        content: input.content,
        imagePrompt: fields.thumbnailText,
      }),
    ]);

    return {
      ...fields,
      coverPrompt,
      coverImageUrl,
      contentImageUrls,
      thumbnailUrl,
    };
  }
}

export const openAIImageProvider = new OpenAIImageProvider();

/** @deprecated Use openAIImageProvider */
export const openAiImageProvider = openAIImageProvider;

/** @deprecated Use OpenAIImageProvider */
export const OpenAiImageProvider = OpenAIImageProvider;
