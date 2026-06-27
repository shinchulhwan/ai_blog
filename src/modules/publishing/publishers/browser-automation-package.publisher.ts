import type {
  PublishPackage,
  PublishPackageResult,
} from "../types/publish-package.types";
import {
  naverFullPublishService,
  NaverFullPublishStepError,
  type NaverFullPublishResult,
} from "../naver/publish/naver-full-publish.service";
import type { JobProgressUpdate } from "@/types/job";

export interface BrowserAutomationPublishResult extends PublishPackageResult {
  naverPublish: NaverFullPublishResult;
}

export class BrowserAutomationPackagePublisher {
  async publish(
    publishPackage: PublishPackage,
    historyId: string,
    options?: {
      onProgress?: (update: JobProgressUpdate) => Promise<void> | void;
    },
  ): Promise<BrowserAutomationPublishResult> {
    try {
      const naverPublish = await naverFullPublishService.publish(
        publishPackage,
        historyId,
        { onProgress: options?.onProgress },
      );

      return {
        success: naverPublish.success,
        mock: naverPublish.mock,
        historyId,
        package: {
          ...publishPackage,
          updatedAt: new Date().toISOString(),
        },
        message: naverPublish.message,
        naverPublish,
      };
    } catch (error) {
      if (error instanceof NaverFullPublishStepError) {
        throw error;
      }

      throw error instanceof Error ? error : new Error("네이버 발행에 실패했습니다.");
    }
  }
}

export const browserAutomationPackagePublisher = new BrowserAutomationPackagePublisher();
