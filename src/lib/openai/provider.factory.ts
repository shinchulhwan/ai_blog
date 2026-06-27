import type { AIProviderType } from "@/types/ai";
import { AI_CONFIG } from "@/config/ai.config";
import { getEnv } from "@/lib/env";
import { NotImplementedError } from "@/lib/errors";
import { OpenAIProvider } from "./provider";

let sharedOpenAIProvider: OpenAIProvider | null = null;

export function createAIProvider(providerType?: AIProviderType): OpenAIProvider {
  const env = getEnv();
  const provider = providerType ?? env.AI_PROVIDER;

  switch (provider) {
    case "openai":
      return new OpenAIProvider({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL ?? AI_CONFIG.providers.openai.model,
        maxOutputTokens: AI_CONFIG.providers.openai.maxOutputTokens,
      });
    case "anthropic":
      throw new NotImplementedError("Anthropic provider");
    case "google":
      throw new NotImplementedError("Google provider");
    default:
      throw new NotImplementedError(`Provider: ${provider}`);
  }
}

/** Singleton OpenAI provider for all server-side AI calls */
export function getOpenAIProvider(): OpenAIProvider {
  if (!sharedOpenAIProvider) {
    sharedOpenAIProvider = createAIProvider("openai");
  }

  return sharedOpenAIProvider;
}

export function resetOpenAIProvider(): void {
  sharedOpenAIProvider = null;
}

export function getAvailableProviders(): AIProviderType[] {
  return ["openai"];
}

export function getPlannedProviders(): AIProviderType[] {
  return ["openai", "anthropic", "google"];
}
