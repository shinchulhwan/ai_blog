import type { AIProviderType } from "@/types/ai";

export const AI_CONFIG = {
  defaultProvider: "openai" as AIProviderType,
  providers: {
    openai: {
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      maxOutputTokens: 4096,
    },
    anthropic: {
      model: "claude-sonnet-4-20250514",
      maxOutputTokens: 4096,
    },
    google: {
      model: "gemini-2.0-flash",
      maxOutputTokens: 4096,
    },
  },
  blogGeneration: {
    temperature: 0.7,
  },
} as const;
