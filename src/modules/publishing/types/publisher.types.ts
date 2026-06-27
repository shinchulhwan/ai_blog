import type { PublishPlatform } from "./publish-platform.types";
import type { PublishContent } from "./publish-content.types";

export interface PublishValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PublishPreviewResult {
  platform: PublishPlatform;
  title: string;
  summary: string;
  htmlPreview: string;
  mock: boolean;
}

export interface PublishOutput {
  platform: PublishPlatform;
  historyId: string;
  externalId: string;
  url: string;
  publishedAt: Date;
  mock: boolean;
}

export interface Publisher {
  readonly platform: PublishPlatform;
  validate(content: PublishContent): Promise<PublishValidationResult>;
  preview(content: PublishContent): Promise<PublishPreviewResult>;
  publish(content: PublishContent): Promise<PublishOutput>;
}

export interface PublishFromHistoryRequest {
  historyId: string;
  platform: PublishPlatform;
}
