import type {
  PublishPackage,
  PublishPackageResult,
} from "../types/publish-package.types";
import { naverPublishingPreparationService } from "../naver/preparation/naver-publishing-preparation.service";
import type { NaverPublishingPreparationResult } from "../naver/preparation/naver-publishing-preparation.types";

export interface BrowserAutomationPublishResult extends PublishPackageResult {
  naverPreparation: NaverPublishingPreparationResult;
}

export class BrowserAutomationPackagePublisher {
  async publish(
    publishPackage: PublishPackage,
    historyId: string,
  ): Promise<BrowserAutomationPublishResult> {
    const naverPreparation = await naverPublishingPreparationService.prepare(
      publishPackage,
      historyId,
    );

    return {
      success: naverPreparation.success,
      mock: naverPreparation.mock,
      historyId,
      package: {
        ...publishPackage,
        updatedAt: new Date().toISOString(),
      },
      message: naverPreparation.message,
      naverPreparation,
    };
  }
}

export const browserAutomationPackagePublisher = new BrowserAutomationPackagePublisher();
