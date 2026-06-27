import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";

export interface NaverManagerContext {
  publishPackage?: PublishPackage;
  historyId?: string;
  accountId?: string;
  sessionId?: string | null;
  browserId?: string | null;
  pageId?: string | null;
  editorPrepared?: boolean;
  preparationId?: string;
  loginPageUrl?: string | null;
  loggedIn?: boolean;
  browserHealthy?: boolean;
  mock: boolean;
}

export interface NaverManager {
  initialize(context: NaverManagerContext): Promise<void>;
  validate(context: NaverManagerContext): Promise<boolean>;
  execute(context: NaverManagerContext): Promise<void>;
  dispose(context: NaverManagerContext): Promise<void>;
}

export function resolveNaverBrowserMode(): "mock" | "playwright" {
  const value = process.env.NAVER_BROWSER_MODE?.trim().toLowerCase();

  if (value === "playwright") {
    return "playwright";
  }

  return "mock";
}
