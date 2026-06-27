import type { PublishContent } from "../../types";

export type NaverAdapterType = "mock" | "open_api" | "playwright" | "browser_automation";

export type NaverPublishStatusValue = "pending" | "publishing" | "published" | "failed";

export interface NaverCredentials {
  username?: string;
  password?: string;
  accessToken?: string;
}

export interface NaverLoginResult {
  success: boolean;
  sessionId: string | null;
  message: string;
  mock: boolean;
}

export interface NaverPublishPayload {
  historyId: string;
  keyword: string;
  title: string;
  html: string;
  metaDescription: string;
  hashtags: string[];
  faq: PublishContent["faq"];
  images: PublishContent["images"];
}

export interface NaverAdapterPublishResult {
  externalId: string;
  url: string;
  publishedAt: Date;
  mock: boolean;
}

export interface NaverPublishStatusResult {
  externalId: string;
  status: NaverPublishStatusValue;
  url: string | null;
  message: string;
  mock: boolean;
}
