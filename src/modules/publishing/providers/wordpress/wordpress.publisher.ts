import { NotImplementedError } from "@/lib/errors";
import { BasePublisher } from "../../core/base-publisher";
import type {
  PublishContent,
  PublishOutput,
  PublishPreviewResult,
  PublishValidationResult,
} from "../../types";

export class WordPressPublisher extends BasePublisher {
  readonly platform = "wordpress" as const;

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
    throw new NotImplementedError("WordPress 발행");
  }
}
