import type {
  AIProvider,
  AIProviderConfig,
  AIGenerateTextRequest,
  AIGenerateTextResponse,
  AIGenerateStructuredRequest,
  AIGenerateStructuredResponse,
} from "@/types/ai";
import { AIProviderError } from "@/lib/errors";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  private client: OpenAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  getClient(): OpenAI {
    return this.client;
  }

  async generateText(
    request: AIGenerateTextRequest,
  ): Promise<AIGenerateTextResponse> {
    const model = request.model ?? this.config.model;

    try {
      const response = await this.client.responses.create({
        model,
        instructions: request.instructions,
        input: request.input,
        temperature: request.temperature,
        max_output_tokens:
          request.maxOutputTokens ?? this.config.maxOutputTokens,
      });

      const text = response.output_text?.trim();

      if (!text) {
        throw new AIProviderError("OpenAI returned an empty response");
      }

      return {
        text,
        provider: this.name,
        model,
        responseId: response.id,
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  async generateStructured<T>(
    request: AIGenerateStructuredRequest<T>,
  ): Promise<AIGenerateStructuredResponse<T>> {
    const model = request.model ?? this.config.model;

    try {
      const response = await this.client.responses.parse({
        model,
        instructions: request.instructions,
        input: request.input,
        temperature: request.temperature,
        max_output_tokens:
          request.maxOutputTokens ?? this.config.maxOutputTokens,
        text: {
          format: zodTextFormat(request.schema, request.schemaName),
        },
      });

      if (!response.output_parsed) {
        throw new AIProviderError(
          "OpenAI returned an empty or invalid structured response",
        );
      }

      return {
        text: JSON.stringify(response.output_parsed),
        parsed: response.output_parsed,
        provider: this.name,
        model,
        responseId: response.id,
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  private wrapError(error: unknown): AIProviderError {
    if (error instanceof AIProviderError) {
      return error;
    }

    if (error instanceof OpenAI.APIError) {
      return new AIProviderError(
        error.message || "OpenAI API request failed",
        error.status ?? 502,
      );
    }

    return new AIProviderError(
      error instanceof Error ? error.message : "OpenAI request failed",
    );
  }
}
