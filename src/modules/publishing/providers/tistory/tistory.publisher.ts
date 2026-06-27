import { NotImplementedError } from "@/lib/errors";
import { BasePublisher } from "../../core/base-publisher";
import type {
  PublishContent,
  PublishOutput,
  PublishPreviewResult,
  PublishValidationResult,
} from "../../types";

export class TistoryPublisher extends BasePublisher {
  readonly platform = "tistory" as const;

  async validate(content: PublishContent): Promise<PublishValidationResult> {
    const errors = this.buildValidationErrors(content);
    return { valid: errors.length === 0, errors };
  }

  async preview(content: PublishContent): Promise<PublishPreviewResult> {
    return {
      platform: this.platform,
      title: content.title,
      summary: content.metaDescription,
      htmlPreview: content.content,
      mock: true,
    };
  }

  async publish(content: PublishContent): Promise<PublishOutput> {
    void content;
    throw new NotImplementedError("Tistory 발행");
  }
}
