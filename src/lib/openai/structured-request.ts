import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { AIProviderError, JsonParseError } from "@/lib/errors";
import { normalizeServiceError } from "@/lib/errors/normalize-error";
import { getOpenAIModel } from "./client";

const DEFAULT_MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 300;

interface StructuredCallParams {
  model?: string;
  instructions: string;
  input: string;
}

type ParseResponseShape = {
  output_parsed?: unknown;
  output_text?: string | null;
};

export type StructuredValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: JsonParseError };

function formatSchemaIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

/** Validates parsed JSON against a Zod schema. */
export function validateStructuredPayload<T>(
  data: unknown,
  schema: z.ZodType<T>,
): StructuredValidationResult<T> {
  const validated = schema.safeParse(data);

  if (validated.success) {
    return { success: true, data: validated.data };
  }

  return {
    success: false,
    error: new JsonParseError(`스키마 검증 실패: ${formatSchemaIssues(validated.error)}`),
  };
}

/** Parses OpenAI structured response output and validates against schema. */
export function parseStructuredResponse<T>(
  response: ParseResponseShape,
  schema: z.ZodType<T>,
): T {
  if (response.output_parsed !== undefined && response.output_parsed !== null) {
    const validated = validateStructuredPayload(response.output_parsed, schema);

    if (validated.success) {
      return validated.data;
    }

    throw validated.error;
  }

  const rawText = response.output_text?.trim();

  if (!rawText) {
    throw new AIProviderError("AI가 빈 응답을 반환했습니다.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new JsonParseError("AI 응답 JSON 형식이 올바르지 않습니다.");
  }

  const validated = validateStructuredPayload(parsed, schema);

  if (validated.success) {
    return validated.data;
  }

  throw validated.error;
}

function isRetryableError(error: Error): boolean {
  if (error instanceof JsonParseError) {
    return true;
  }

  if (error instanceof AIProviderError) {
    const { statusCode } = error;
    return (
      statusCode === 408 ||
      statusCode === 502 ||
      statusCode === 503 ||
      statusCode === 504 ||
      statusCode >= 429
    );
  }

  return false;
}

function buildRetryInput(baseInput: string, attempt: number, lastError: Error): string {
  if (attempt <= 1) {
    return baseInput;
  }

  return `${baseInput}\n\n[Retry ${attempt}: previous response was invalid — ${lastError.message}. Return valid JSON only.]`;
}

function buildRetryInstructions(
  baseInstructions: string,
  attempt: number,
  lastError: Error,
): string {
  if (attempt <= 1) {
    return baseInstructions;
  }

  return `${baseInstructions}\n\nPrevious attempt failed validation: ${lastError.message}. Respond with strictly valid JSON matching the schema.`;
}

async function waitBeforeRetry(attempt: number): Promise<void> {
  if (attempt <= 1) {
    return;
  }

  const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 2);
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

/**
 * Calls OpenAI Responses API with structured JSON output.
 * Retries automatically when JSON.parse or schema validation fails.
 */
export async function callStructuredJson<T>(
  client: OpenAI,
  params: StructuredCallParams,
  schema: z.ZodType<T>,
  schemaName: string,
  maxRetries = DEFAULT_MAX_RETRIES,
): Promise<T> {
  let lastError: Error = new Error("AI 응답을 처리하지 못했습니다.");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await waitBeforeRetry(attempt);
      }

      const response = await client.responses.parse({
        model: params.model ?? getOpenAIModel(),
        instructions: buildRetryInstructions(params.instructions, attempt, lastError),
        input: buildRetryInput(params.input, attempt, lastError),
        text: {
          format: zodTextFormat(schema, schemaName),
        },
      });

      return parseStructuredResponse(response, schema);
    } catch (error) {
      lastError = normalizeServiceError(error);

      if (attempt >= maxRetries || !isRetryableError(lastError)) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

export { DEFAULT_MAX_RETRIES as STRUCTURED_JSON_MAX_RETRIES };
