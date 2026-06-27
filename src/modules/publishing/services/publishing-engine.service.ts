import { blogHistoryService } from "@/modules/history";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ImageResult } from "@/lib/schemas/image-result.schema";
import { browserAutomationPackagePublisher } from "../publishers/browser-automation-package.publisher";
import { buildPublishPackage } from "./publish-package.builder";
import { cookieManager } from "../naver/cookies/cookie.manager";
import { resolveNaverBrowserMode } from "../naver/managers/naver-manager.types";
import { sessionManager } from "../naver/session/session.manager";
import { hasNaverAuthCookies } from "../naver/cookies/playwright-cookie.util";
import type {
  PublishEngineValidateInput,
  PublishPackage,
  PublishPackageResult,
} from "../types/publish-package.types";

export interface PublishingEngineExecuteInput {
  keyword: string;
  projectId: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  imageResult: ImageResult;
  result: BlogFullResponse;
  historyId?: string;
  onProgress?: (update: import("@/types/job").JobProgressUpdate) => Promise<void> | void;
}

export interface PublishingEngineExecuteResult {
  publishPackage: PublishPackage;
  packageResult: PublishPackageResult;
  historyId: string;
  publishedUrl: string | null;
  publishedAt: string | null;
  naverPostId: string | null;
  mock: boolean;
}

export class PublishingEngineService {
  async canAttemptNaverLogin(accountId = "env-default"): Promise<boolean> {
    if (resolveNaverBrowserMode() === "mock") {
      return true;
    }

    const cookies = await cookieManager.loadCookies(accountId);

    if (cookies && hasNaverAuthCookies(cookies)) {
      return true;
    }

    const restored = await sessionManager.restoreSession(accountId);

    if (restored && (await sessionManager.validateSession(restored.id))) {
      return true;
    }

    const username = process.env.NAVER_USERNAME?.trim();
    const password = process.env.NAVER_PASSWORD?.trim();

    return Boolean(username && password);
  }

  async validate(input: PublishEngineValidateInput): Promise<boolean> {
    return (
      Boolean(input.keyword.trim()) &&
      Boolean(input.projectId) &&
      input.writingBrainCompleted &&
      input.hasResult &&
      input.hasImageResult &&
      (await this.canAttemptNaverLogin())
    );
  }

  async execute(
    input: PublishingEngineExecuteInput,
  ): Promise<PublishingEngineExecuteResult> {
    const publishPackage = buildPublishPackage({
      titleData: input.titleData,
      draft: input.draft,
      imageResult: input.imageResult,
    });

    const historyRecord = input.historyId
      ? await blogHistoryService.getById(input.historyId).then((record) => {
          if (!record) {
            throw new Error("History 기록을 찾을 수 없습니다.");
          }
          return record;
        })
      : await blogHistoryService.saveFromBlogResult(
          input.keyword,
          input.result,
          "READY",
          input.projectId,
        );

    const publishResult = await browserAutomationPackagePublisher.publish(
      publishPackage,
      historyRecord.id,
      { onProgress: input.onProgress },
    );

    if (!publishResult.success || !publishResult.naverPublish.publishedUrl) {
      throw new Error(
        publishResult.message || "네이버 블로그 발행에 실패했습니다.",
      );
    }

    return {
      publishPackage,
      packageResult: publishResult,
      historyId: historyRecord.id,
      publishedUrl: publishResult.naverPublish.publishedUrl,
      publishedAt: publishResult.naverPublish.publishedAt,
      naverPostId: publishResult.naverPublish.naverPostId,
      mock: publishResult.mock,
    };
  }
}

export const publishingEngineService = new PublishingEngineService();
