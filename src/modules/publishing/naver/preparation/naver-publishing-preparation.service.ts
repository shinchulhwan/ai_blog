import { randomUUID } from "crypto";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { BrowserManager } from "../browser/browser.manager";
import { browserManager } from "../browser/browser.manager";
import type { CookieManager } from "../cookies/cookie.manager";
import { cookieManager } from "../cookies/cookie.manager";
import type { EditorManager } from "../editor/editor.manager";
import { editorManager } from "../editor/editor.manager";
import type { LoginManager } from "../login/login.manager";
import { loginManager } from "../login/login.manager";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import { resolveNaverBrowserMode } from "../managers/naver-manager.types";
import { NaverLoginFailedError } from "../login/naver-login.errors";
import type { PublishManager } from "../publish/publish.manager";
import { publishManager } from "../publish/publish.manager";
import type { SessionManager } from "../session/session.manager";
import { sessionManager } from "../session/session.manager";
import type { NaverPublishingPreparationResult } from "./naver-publishing-preparation.types";

export interface NaverPublishingPreparationDeps {
  browser: BrowserManager;
  session: SessionManager;
  cookies: CookieManager;
  login: LoginManager;
  editor: EditorManager;
  publish: PublishManager;
}

export class NaverPublishingPreparationService {
  private readonly pipeline: NaverManager[];

  constructor(private readonly deps: NaverPublishingPreparationDeps) {
    this.pipeline = [
      this.deps.browser,
      this.deps.cookies,
      this.deps.session,
      this.deps.login,
      this.deps.editor,
      this.deps.publish,
    ];
  }

  async prepare(
    publishPackage: PublishPackage,
    historyId: string,
    accountId = "env-default",
  ): Promise<NaverPublishingPreparationResult> {
    const context: NaverManagerContext = {
      publishPackage,
      historyId,
      accountId,
      sessionId: null,
      browserId: null,
      pageId: null,
      editorPrepared: false,
      preparationId: randomUUID(),
      mock: resolveNaverBrowserMode() === "mock",
    };

    try {
      for (const manager of this.pipeline) {
        await manager.initialize(context);

        const valid = await manager.validate(context);

        if (!valid) {
          throw new Error("네이버 발행 준비 Manager validate()에 실패했습니다.");
        }

        await manager.execute(context);
      }

      if (!context.loggedIn) {
        throw new NaverLoginFailedError(
          "네이버 로그인에 실패했습니다. Publishing Engine을 실행할 수 없습니다.",
        );
      }

      return {
        success: true,
        mock: context.mock,
        historyId,
        publishPackage,
        sessionId: context.sessionId ?? null,
        browserId: context.browserId ?? null,
        pageId: context.pageId ?? null,
        editorPrepared: Boolean(context.editorPrepared),
        plannedEditorSteps: ["title", "content", "images", "tags"],
        loggedIn: true,
        loginPageUrl: context.loginPageUrl ?? null,
        browserHealthy: Boolean(context.browserHealthy),
        message: "네이버 로그인 성공 (실제 발행 없음)",
        preparedAt: new Date().toISOString(),
      };
    } catch (error) {
      context.loggedIn = false;
      throw error;
    } finally {
      for (const manager of [...this.pipeline].reverse()) {
        await manager.dispose(context).catch(() => undefined);
      }
    }
  }
}

export const naverPublishingPreparationService = new NaverPublishingPreparationService({
  browser: browserManager,
  session: sessionManager,
  cookies: cookieManager,
  login: loginManager,
  editor: editorManager,
  publish: publishManager,
});
