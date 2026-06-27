import { resetOpenAIClient } from "@/lib/openai/client";
import { IMAGE_CONFIG } from "@/config/image.config";
import { ImageEngineService } from "@/modules/images/services/image-engine.service";
import { openAIImageProvider } from "@/modules/images/providers/openai.image-provider";

export type OpenAIImageIntegrationTestStatus = "SUCCESS" | "SKIPPED" | "FAILED";

export interface OpenAIImageIntegrationTestResult {
  status: OpenAIImageIntegrationTestStatus;
  model: string;
  durationMs: number;
  tests: Array<{
    name: string;
    passed: boolean;
    errorMessage?: string;
    durationMs: number;
  }>;
}

const TEST_INPUT = {
  keyword: "openai-image-test",
  title: "OpenAI Image Integration Test",
  content: "Minimal blog content for image generation smoke test.",
  metaDescription: "OpenAI image integration smoke test.",
  projectId: "openai-image-integration-test",
};

function hasRealApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  return Boolean(key && key !== "test-key" && key.length > 10);
}

export class OpenAIImageIntegrationTestService {
  async run(): Promise<OpenAIImageIntegrationTestResult> {
    const startedAt = Date.now();
    const model = IMAGE_CONFIG.openai.model;
    const tests: OpenAIImageIntegrationTestResult["tests"] = [];

    tests.push(await this.runMockFallbackTest());

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
    tests.push(await this.runCoverImageRealTest());

    const failed = tests.some((test) => !test.passed);

    return {
      status: failed ? "FAILED" : "SUCCESS",
      model,
      durationMs: Date.now() - startedAt,
      tests,
    };
  }

  private async runMockFallbackTest(): Promise<
    OpenAIImageIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();
    const previousProvider = process.env.IMAGE_PROVIDER;
    const previousForceFail = process.env.OPENAI_IMAGE_FORCE_FAIL;

    try {
      process.env.IMAGE_PROVIDER = "openai";
      process.env.OPENAI_IMAGE_FORCE_FAIL = "true";

      const service = new ImageEngineService();
      const result = await service.execute(TEST_INPUT);

      if (!result.usedFallback || result.provider !== "mock") {
        throw new Error(
          `Expected mock fallback, got provider=${result.provider}, usedFallback=${result.usedFallback}`,
        );
      }

      if (!result.result.coverImageUrl) {
        throw new Error("Mock fallback did not produce a cover image URL.");
      }

      return {
        name: "mock-fallback",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "mock-fallback",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (previousProvider === undefined) {
        delete process.env.IMAGE_PROVIDER;
      } else {
        process.env.IMAGE_PROVIDER = previousProvider;
      }

      if (previousForceFail === undefined) {
        delete process.env.OPENAI_IMAGE_FORCE_FAIL;
      } else {
        process.env.OPENAI_IMAGE_FORCE_FAIL = previousForceFail;
      }
    }
  }

  private async runCoverImageRealTest(): Promise<
    OpenAIImageIntegrationTestResult["tests"][number]
  > {
    const startedAt = Date.now();

    try {
      const url = await openAIImageProvider.generateCoverImage({
        title: TEST_INPUT.title,
        content: TEST_INPUT.content,
        imagePrompt: "Minimal abstract blog cover, clean design, no text",
      });

      if (!url.startsWith("http") && !url.startsWith("data:image")) {
        throw new Error(`Unexpected image URL format: ${url.slice(0, 80)}`);
      }

      return {
        name: "cover-image-real",
        passed: true,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: "cover-image-real",
        passed: false,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const openAIImageIntegrationTestService = new OpenAIImageIntegrationTestService();
