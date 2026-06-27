export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  provider: string;
  createdAt: Date;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  style?: "natural" | "vivid";
}

/** Placeholder for future image generation */
export interface ImageService {
  generate(request: ImageGenerationRequest): Promise<GeneratedImage>;
}
