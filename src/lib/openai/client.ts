import OpenAI from "openai";
import { AI_CONFIG } from "@/config/ai.config";
import { getEnv } from "@/lib/env";

let clientInstance: OpenAI | null = null;

/** Shared OpenAI client — uses OPENAI_API_KEY from environment */
export function getOpenAIClient(): OpenAI {
  if (!clientInstance) {
    const { OPENAI_API_KEY } = getEnv();
    clientInstance = new OpenAI({ apiKey: OPENAI_API_KEY });
  }

  return clientInstance;
}

/** Shared model id — uses OPENAI_MODEL from environment */
export function getOpenAIModel(): string {
  return getEnv().OPENAI_MODEL ?? AI_CONFIG.providers.openai.model;
}

/** Test-only: reset cached client between runs */
export function resetOpenAIClient(): void {
  clientInstance = null;
}
