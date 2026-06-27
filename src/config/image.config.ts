export const IMAGE_CONFIG = {
  provider: (process.env.IMAGE_PROVIDER?.trim().toLowerCase() ?? "mock") as "mock" | "openai",
  openai: {
    model: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3",
    coverSize: "1792x1024" as const,
    contentSize: "1024x1024" as const,
    thumbnailSize: "1024x1024" as const,
    quality: "standard" as const,
  },
  mockBaseUrl: process.env.MOCK_IMAGE_BASE_URL ?? "https://mock.local/images",
} as const;
