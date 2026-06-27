import type OpenAI from "openai";
import { AIProviderError } from "@/lib/errors";
import {
  buildDecisionFixture,
  buildResearchFixture,
  buildWritingBrainDraftFixture,
  buildWritingBrainFinalValidationFixture,
  buildWritingBrainIntentFixture,
  buildWritingBrainOutlineFixture,
  buildWritingBrainQualityReviewFixture,
  buildWritingBrainResearchFixture,
  buildWritingBrainRewriteFixture,
} from "../fixtures/openai-fixtures";

export type MockOpenAIMode =
  | "success"
  | "openai-failure"
  | "json-parse-failure"
  | "retry"
  | "timeout";

export interface MockOpenAIOptions {
  mode?: MockOpenAIMode;
  failCount?: number;
  delayMs?: number;
}

function resolveFixture(schemaName?: string): unknown {
  switch (schemaName) {
    case "keyword_research":
      return buildResearchFixture();
    case "keyword_decision":
      return buildDecisionFixture();
    case "writing_brain_intent":
      return buildWritingBrainIntentFixture();
    case "writing_brain_research":
      return buildWritingBrainResearchFixture();
    case "writing_brain_outline":
      return buildWritingBrainOutlineFixture();
    case "writing_brain_draft":
      return buildWritingBrainDraftFixture();
    case "writing_brain_quality_review":
      return buildWritingBrainQualityReviewFixture();
    case "writing_brain_rewrite":
      return buildWritingBrainRewriteFixture();
    case "writing_brain_final_validation":
      return buildWritingBrainFinalValidationFixture();
    case "openai_integration_ping":
      return { ok: true, message: "pong" };
    case "openai_integration_complex":
      return {
        ok: true,
        message: "validated",
        count: 3,
        tags: ["integration", "openai"],
      };
    default:
      return buildResearchFixture();
  }
}

function extractSchemaName(params: unknown): string | undefined {
  if (!params || typeof params !== "object") {
    return undefined;
  }

  const record = params as {
    text?: {
      format?: {
        name?: string;
      };
    };
  };

  return record.text?.format?.name;
}

function buildParseHandler(options: MockOpenAIOptions) {
  let failRemaining = options.failCount ?? 0;

  return async (params: unknown) => {
    if (options.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, options.delayMs);
      });
    }

    if (options.mode === "timeout") {
      await new Promise(() => {
        /* never resolves */
      });
    }

    if (options.mode === "openai-failure") {
      throw new AIProviderError("Integration test OpenAI failure", 500);
    }

    if (options.mode === "json-parse-failure") {
      return {
        output_parsed: { invalid: true },
        output_text: "not-json",
      };
    }

    if (options.mode === "retry" && failRemaining > 0) {
      failRemaining -= 1;
      return {
        output_parsed: { invalid: true },
        output_text: "{broken",
      };
    }

    const schemaName = extractSchemaName(params);
    const fixture = resolveFixture(schemaName);

    return {
      output_parsed: fixture,
      output_text: JSON.stringify(fixture),
    };
  };
}

export function createMockOpenAIClient(options: MockOpenAIOptions = {}): OpenAI {
  const parse = buildParseHandler(options);

  return {
    responses: { parse },
  } as unknown as OpenAI;
}

export function createThrowingOpenAIClient(message: string): OpenAI {
  return {
    responses: {
      parse: async () => {
        throw new AIProviderError(message);
      },
    },
  } as unknown as OpenAI;
}
