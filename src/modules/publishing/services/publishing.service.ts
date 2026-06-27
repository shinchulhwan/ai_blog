import { blogHistoryService } from "@/modules/history";
import { NaverPublisher } from "../naver";
import { createPublisher, getAvailablePublishers } from "../core/publisher.factory";
import { mapHistoryToPublishContent } from "./publish-content.mapper";
import type {
  PublishFromHistoryRequest,
  PublishOutput,
  PublishPlatform,
  PublishPreviewResult,
  PublishValidationResult,
} from "../types";

export class PublishingService {
  listPlatforms(): PublishPlatform[] {
    return getAvailablePublishers();
  }

  async validateFromHistory(
    historyId: string,
    platform: PublishPlatform,
  ): Promise<PublishValidationResult> {
    const history = await blogHistoryService.getById(historyId);

    if (!history) {
      return { valid: false, errors: ["생성 이력을 찾을 수 없습니다."] };
    }

    const content = mapHistoryToPublishContent(history);
    return createPublisher(platform).validate(content);
  }

  async previewFromHistory(
    historyId: string,
    platform: PublishPlatform,
  ): Promise<PublishPreviewResult> {
    const history = await this.requireHistory(historyId);
    const content = mapHistoryToPublishContent(history);
    const publisher = createPublisher(platform);

    const validation = await publisher.validate(content);

    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    return publisher.preview(content);
  }

  async publishFromHistory(request: PublishFromHistoryRequest): Promise<PublishOutput> {
    const history = await this.requireHistory(request.historyId);
    const content = mapHistoryToPublishContent(history);
    const publisher = createPublisher(request.platform);

    const validation = await publisher.validate(content);

    if (!validation.valid) {
      await blogHistoryService.markPublishFailed(
        request.historyId,
        validation.errors.join("; "),
      );
      throw new Error(validation.errors.join("; "));
    }

    await blogHistoryService.markPublishing(request.historyId);

    try {
      if (request.platform === "naver" && publisher instanceof NaverPublisher) {
        await publisher.login();
      }

      const output = await publisher.publish(content);

      if (request.platform === "naver" && publisher instanceof NaverPublisher) {
        const status = await publisher.getPublishStatus(output.externalId);

        if (status.status === "failed") {
          throw new Error(status.message);
        }
      }

      await blogHistoryService.markPublished(request.historyId, {
        naverPostId: output.externalId,
        publishUrl: output.url,
      });

      return output;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "발행에 실패했습니다.";
      await blogHistoryService.markPublishFailed(request.historyId, message);
      throw new Error(message);
    }
  }

  private async requireHistory(historyId: string) {
    const history = await blogHistoryService.getById(historyId);

    if (!history) {
      throw new Error("생성 이력을 찾을 수 없습니다.");
    }

    return history;
  }
}

export const publishingService = new PublishingService();
