import { z } from "zod";
import {
  getOpenAIClient,
  getOpenAIModel,
  resetOpenAIClient,
} from "@/lib/openai/client";
import {
  callStructuredJson,
  parseStructuredResponse,
  validateStructuredPayload,
} from "@/lib/openai/structured-request";
import { getOpenAIProvider, resetOpenAIProvider } from "@/lib/openai/provider.factory";
import { createMockOpenAIClient } from "../helpers/mock-openai-client";

const pingSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

const integrationSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  count: z.number().int().min(1).max(10),
  tags: z.array(z.string()).min(1),
});

export type OpenAIIntegrationTestStatus = "SUCCESS" | "SKIPPED" | "FAILED";

export interface OpenAIIntegrationTestResult {
  status: OpenAIIntegrationTestStatus;
  model: string;
  durationMs: number;
  tests: Array<{
    name: string;
    passed: boolean;
    errorMessage?: string;
    durationMs: number;
  }>;
}

function hasRealApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key !== "test-key" && key.length > 10);
}

export class OpenAIIntegrationTestService {
  async run(): Promise<OpenAIIntegrationTestResult> {
    const startedAt = Date.now();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o";
    const tests: OpenAIIntegrationTestResult["tests"] = [];

    tests.push(await this.runSchemaValidationUnitTest());
    tests.push(await this.runJsonRetryMockTest());

    if (!hasRealApiKey()) {
      const failed = tests.some((test) => !test.passed);

      return {
        status: failed ? "FAILED" : "SKIPPED",
        model,
        durationMs: Date.now() - startedAt,
        tests,
      };
    }

    resetOpenAIClient();
    resetOpenAIProvider();

    tests.push(await this.runStructuredJsonTest());
    tests.push(await this.runProviderTextTest());
    tests.push(await this.runComplexSchemaRealTest());

    const failed = tests.some((test) => !test.passed);

    return {
      status: failed ? "FAILED" : "SUCCESS",
      model: getOpenAIModel(),
      durationMs: Date.now() - startedAt,
      tests,
    };
  }

  private async runSchemaValidationUnitTest(): Promise<
    OpenAIIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const valid = validateStructuredPayload({ ok: true, message: "pong" }, pingSchema);

      if (!valid.success) {
        throw valid.error;
      }

      const invalid = validateStructuredPayload({ ok: "yes", message: 1 }, pingSchema);

      if (invalid.success) {
        throw new Error("Invalid payload was accepted by schema validation.");
      }

      parseStructuredResponse(
        { output_parsed: { ok: true, message: "pong" } },
        pingSchema,
      );

      let parseFailed = false;

      try {
        parseStructuredResponse({ output_text: "{broken" }, pingSchema);
      } catch (error) {
        parseFailed = error instanceof Error;
      }

      if (!parseFailed) {
        throw new Error("Broken JSON was not rejected.");
      }

      return {
        name: "schema-validation",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "schema-validation",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runJsonRetryMockTest(): Promise<
    OpenAIIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const client = createMockOpenAIClient({ mode: "retry", failCount: 2 });
      const result = await callStructuredJson(
        client,
        {
          instructions: "Return ok true and message pong.",
          input: "ping",
        },
        pingSchema,
        "openai_integration_ping",
        3,
      );

      if (!result.ok || result.message !== "pong") {
        throw new Error("Retry mock did not return expected payload.");
      }

      return {
        name: "json-retry-recovery",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "json-retry-recovery",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runStructuredJsonTest(): Promise<
    OpenAIIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const client = getOpenAIClient();
      const result = await callStructuredJson(
        client,
        {
          instructions:
            "Respond with JSON only. Set ok to true and message to 'pong'.",
          input: "ping",
        },
        pingSchema,
        "openai_integration_ping",
        3,
      );

      if (!result.ok || result.message !== "pong") {
        throw new Error("Structured JSON response did not match expected payload.");
      }

      return {
        name: "structured-json-real",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "structured-json-real",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runProviderTextTest(): Promise<
    OpenAIIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const provider = getOpenAIProvider();
      const response = await provider.generateText({
        instructions: "Reply with exactly: pong",
        input: "ping",
        maxOutputTokens: 16,
      });

      if (!response.text.toLowerCase().includes("pong")) {
        throw new Error(`Unexpected provider response: ${response.text}`);
      }

      if (response.model !== getOpenAIModel()) {
        throw new Error(
          `Model mismatch: expected ${getOpenAIModel()}, got ${response.model}`,
        );
      }

      return {
        name: "provider-text-real",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "provider-text-real",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runComplexSchemaRealTest(): Promise<
    OpenAIIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const client = getOpenAIClient();
      const result = await callStructuredJson(
        client,
        {
          instructions:
            "Return JSON with ok=true, message='validated', count=3, tags=['integration','openai'].",
          input: "validate complex schema",
        },
        integrationSchema,
        "openai_integration_complex",
        3,
      );

      if (
        !result.ok ||
        result.message !== "validated" ||
        result.count !== 3 ||
        result.tags.length < 1
      ) {
        throw new Error("Complex schema response did not match expected payload.");
      }

      return {
        name: "complex-schema-real",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "complex-schema-real",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const openAIIntegrationTestService = new OpenAIIntegrationTestService();
