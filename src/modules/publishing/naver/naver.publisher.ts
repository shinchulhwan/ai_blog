import { BasePublisher } from "../core/base-publisher";
import { createNaverAdapter } from "./adapters/naver-adapter.factory";
import type { NaverPublishAdapter } from "./adapters/naver-adapter.types";
import { convertPublishContentToNaverHtml } from "./converters/naver-html.converter";
import type {
  PublishContent,
  PublishOutput,
  PublishPreviewResult,
  PublishValidationResult,
} from "../types";
import type {
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "./types/naver.types";

export class NaverPublisher extends BasePublisher {
  readonly platform = "naver" as const;

  private sessionId: string | null = null;
  private readonly adapter: NaverPublishAdapter;

  constructor(adapter?: NaverPublishAdapter) {
    super();
    this.adapter = adapter ?? createNaverAdapter();
  }

  getAdapterType() {
    return this.adapter.type;
  }

  async login(credentials?: NaverCredentials): Promise<NaverLoginResult> {
    const result = await this.adapter.login(credentials);

    if (result.success) {
      this.sessionId = result.sessionId;
    }

    return result;
  }

  async validate(content: PublishContent): Promise<PublishValidationResult> {
    const errors = this.buildValidationErrors(content);
    return { valid: errors.length === 0, errors };
  }

  convertToHtml(content: PublishContent): string {
    return convertPublishContentToNaverHtml(content);
  }

  async preview(content: PublishContent): Promise<PublishPreviewResult> {
    return {
      platform: this.platform,
      title: content.title,
      summary: content.metaDescription,
      htmlPreview: this.convertToHtml(content),
      mock: this.adapter.type === "mock",
    };
  }

  async publish(content: PublishContent): Promise<PublishOutput> {
    const validation = await this.validate(content);

    if (!validation.valid) {
      throw new Error(validation.errors.join("; "));
    }

    if (!this.sessionId) {
      await this.login();
    }

    const html = this.convertToHtml(content);
    const payload = this.buildPublishPayload(content, html);
    const result = await this.adapter.publish(payload);

    return {
      platform: this.platform,
      historyId: content.historyId,
      externalId: result.externalId,
      url: result.url,
      publishedAt: result.publishedAt,
      mock: result.mock,
    };
  }

  async getPublishStatus(externalId: string): Promise<NaverPublishStatusResult> {
    return this.adapter.getPublishStatus(externalId);
  }

  private buildPublishPayload(
    content: PublishContent,
    html: string,
  ): NaverPublishPayload {
    return {
      historyId: content.historyId,
      keyword: content.keyword,
      title: content.title,
      html,
      metaDescription: content.metaDescription,
      hashtags: content.hashtags,
      faq: content.faq,
      images: content.images,
    };
  }
}
