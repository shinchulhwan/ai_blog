import type { z } from "zod";

export type AIProviderType = "openai" | "anthropic" | "google";

export interface AIGenerateTextRequest {
  instructions: string;
  input: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIGenerateTextResponse {
  text: string;
  provider: AIProviderType;
  model: string;
  responseId?: string;
}

export interface AIGenerateStructuredRequest<T> extends AIGenerateTextRequest {
  schema: z.ZodType<T>;
  schemaName: string;
}

export interface AIGenerateStructuredResponse<T> extends AIGenerateTextResponse {
  parsed: T;
}

export interface AIProvider {
  readonly name: AIProviderType;
  generateText(request: AIGenerateTextRequest): Promise<AIGenerateTextResponse>;
  generateStructured<T>(
    request: AIGenerateStructuredRequest<T>,
  ): Promise<AIGenerateStructuredResponse<T>>;
}

export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxOutputTokens?: number;
}
