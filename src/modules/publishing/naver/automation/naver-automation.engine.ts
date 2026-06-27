import type { RegisterNaverAccountInput } from "../accounts/account.types";
import { naverAccountRegistry } from "../accounts/account.registry";
import type { BrowserManager } from "../browser/browser.manager";
import { browserManager } from "../browser/browser.manager";
import type { CookieManager } from "../cookies/cookie.manager";
import { cookieManager } from "../cookies/cookie.manager";
import type { EditorManager } from "../editor/editor.manager";
import { editorManager } from "../editor/editor.manager";
import type { EditorAccessResult } from "../editor/editor.types";
import type { LoginManager, LoginOptions } from "../login/login.manager";
import { loginManager } from "../login/login.manager";
import type { PublishManager } from "../publish/publish.manager";
import { publishManager } from "../publish/publish.manager";
import type { SessionManager } from "../session/session.manager";
import { sessionManager } from "../session/session.manager";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { PublishResult } from "../publish/publish.types";
import type {
  NaverAdapterPublishResult,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";

export interface NaverAutomationEngineDeps {
  browser: BrowserManager;
  session: SessionManager;
  cookies: CookieManager;
  login: LoginManager;
  editor: EditorManager;
  publish: PublishManager;
}

/**
 * Naver Automation Engine — composes browser, session, cookie, login, publish managers.
 */
export class NaverAutomationEngine {
  readonly browser: BrowserManager;
  readonly session: SessionManager;
  readonly cookies: CookieManager;
  readonly login: LoginManager;
  readonly editor: EditorManager;
  readonly publish: PublishManager;

  private activeSessionId: string | null = null;

  constructor(deps: NaverAutomationEngineDeps) {
    this.browser = deps.browser;
    this.session = deps.session;
    this.cookies = deps.cookies;
    this.login = deps.login;
    this.editor = deps.editor;
    this.publish = deps.publish;
  }

  registerAccount(input: RegisterNaverAccountInput) {
    return naverAccountRegistry.register(input);
  }

  listAccounts() {
    return naverAccountRegistry.list();
  }

  async ensureLoggedIn(options: LoginOptions = {}): Promise<NaverLoginResult> {
    if (
      this.activeSessionId &&
      (await this.login.validateSession(this.activeSessionId))
    ) {
      return {
        success: true,
        sessionId: this.activeSessionId,
        message: "기존 세션 사용",
        mock: this.browser.isMockMode(),
      };
    }

    const result = await this.login.ensureLogin(options);

    if (result.success && result.sessionId) {
      this.activeSessionId = result.sessionId;
    }

    return result;
  }

  async ensureEditorAccess(pageId?: string): Promise<EditorAccessResult> {
    const loginResult = await this.ensureLoggedIn();

    if (!loginResult.success) {
      return {
        success: false,
        pageId: null,
        editorUrl: null,
        context: null,
        message: loginResult.message,
        mock: loginResult.mock,
      };
    }

    const session = loginResult.sessionId
      ? this.session.get(loginResult.sessionId)
      : null;

    return this.editor.accessEditor(pageId ?? session?.pageId ?? undefined);
  }

  async publishPackage(
    pageId: string,
    historyId: string,
    publishPackage: PublishPackage,
    retryCount = 0,
  ): Promise<PublishResult> {
    const loginResult = await this.ensureLoggedIn();

    if (!loginResult.success) {
      return {
        success: false,
        publishedUrl: null,
        publishedAt: null,
        elapsedTime: 0,
        errorCode: "NAVER_LOGIN_FAILED",
        errorMessage: loginResult.message,
        retryCount,
        mock: loginResult.mock,
        historyId,
        naverPostId: null,
      };
    }

    return this.publish.publish({
      pageId,
      historyId,
      publishPackage,
      sessionId: loginResult.sessionId ?? undefined,
      retryCount,
    });
  }

  async publishPost(payload: NaverPublishPayload): Promise<NaverAdapterPublishResult> {
    const loginResult = await this.ensureLoggedIn();

    if (!loginResult.success || !loginResult.sessionId) {
      throw new Error(loginResult.message);
    }

    return this.publish.publishAdapter(loginResult.sessionId, payload);
  }

  async getPublishStatus(externalId: string): Promise<NaverPublishStatusResult> {
    if (!this.activeSessionId) {
      return {
        externalId,
        status: "failed",
        url: null,
        message: "활성 세션이 없습니다.",
        mock: true,
      };
    }

    return this.publish.getPublishStatus(this.activeSessionId, externalId);
  }

  async shutdown(): Promise<void> {
    if (this.activeSessionId) {
      await this.login.logout(this.activeSessionId);
      this.activeSessionId = null;
    }

    await this.browser.close();
  }
}

export const naverAutomationEngine = new NaverAutomationEngine({
  browser: browserManager,
  session: sessionManager,
  cookies: cookieManager,
  login: loginManager,
  editor: editorManager,
  publish: publishManager,
});
