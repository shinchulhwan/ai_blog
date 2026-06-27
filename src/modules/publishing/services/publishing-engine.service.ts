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
import type { NaverPublishingPreparationResult } from "../naver/preparation/naver-publishing-preparation.types";

export interface PublishingEngineExecuteInput {
  keyword: string;
  projectId: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  imageResult: ImageResult;
  result: BlogFullResponse;
  historyId?: string;
}

export interface PublishingEngineExecuteResult {
  publishPackage: PublishPackage;
  packageResult: PublishPackageResult;
  historyId: string;
  naverPreparation: NaverPublishingPreparationResult;
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
    );

    if (!publishResult.success || !publishResult.naverPreparation.loggedIn) {
      throw new Error(
        publishResult.message || "네이버 로그인에 실패하여 Publishing Engine을 완료할 수 없습니다.",
      );
    }

    return {
      publishPackage,
      packageResult: publishResult,
      historyId: historyRecord.id,
      naverPreparation: publishResult.naverPreparation,
    };
  }
}

export const publishingEngineService = new PublishingEngineService();
