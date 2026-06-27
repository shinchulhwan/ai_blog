import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";

export interface NaverPublishInput {
  pageId: string;
  historyId: string;
  publishPackage: PublishPackage;
  sessionId?: string;
  retryCount?: number;
}

export interface PublishResult {
  success: boolean;
  publishedUrl: string | null;
  publishedAt: string | null;
  elapsedTime: number;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  mock: boolean;
  historyId: string;
  naverPostId?: string | null;
}

export interface PublishValidateResult {
  valid: boolean;
  pageId: string;
  titleReady: boolean;
  contentReady: boolean;
  message: string;
  mock: boolean;
}
