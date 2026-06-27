import type {
  PublishContent,
  PublishOutput,
  PublishPreviewResult,
  PublishValidationResult,
  Publisher,
} from "../types";
import type { PublishPlatform } from "../types/publish-platform.types";

export abstract class BasePublisher implements Publisher {
  abstract readonly platform: PublishPlatform;

  abstract validate(content: PublishContent): Promise<PublishValidationResult>;
  abstract preview(content: PublishContent): Promise<PublishPreviewResult>;
  abstract publish(content: PublishContent): Promise<PublishOutput>;

  protected buildValidationErrors(content: PublishContent): string[] {
    const errors: string[] = [];

    if (!content.title.trim()) {
      errors.push("제목이 비어 있습니다.");
    }

    if (!content.content.trim()) {
      errors.push("본문이 비어 있습니다.");
    }

    if (!content.metaDescription.trim()) {
      errors.push("메타설명이 비어 있습니다.");
    }

    if (content.faq.length === 0) {
      errors.push("FAQ가 없습니다.");
    }

    if (content.hashtags.length === 0) {
      errors.push("해시태그가 없습니다.");
    }

    if (!content.images.representative.prompt.trim()) {
      errors.push("대표 이미지 프롬프트가 없습니다.");
    }

    return errors;
  }
}
