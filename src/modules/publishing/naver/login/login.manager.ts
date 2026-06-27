import type { BrowserPageHandle } from "../browser/browser.types";
import type { BrowserManager } from "../browser/browser.manager";
import { browserManager } from "../browser/browser.manager";
import type { CookieManager } from "../cookies/cookie.manager";
import { cookieManager } from "../cookies/cookie.manager";
import { toNaverCookies } from "../cookies/playwright-cookie.util";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import type { SessionManager } from "../session/session.manager";
import { sessionManager } from "../session/session.manager";
import type { NaverSession } from "../session/session.types";
import type { NaverCredentials, NaverLoginResult } from "../types/naver.types";
import { naverAccountRegistry } from "../accounts/account.registry";
import type { NaverAccountCredentials } from "../accounts/account.types";
import {
  NaverLoginFailedError,
  NaverSessionExpiredError,
  NaverTwoFactorRequiredError,
  wrapNaverBrowserError,
} from "./naver-login.errors";
import {
  detectNaverCaptcha,
  detectNaverLoginFailure,
  detectNaverTwoFactor,
  NAVER_BLOG_URL,
  NAVER_LOGIN_URL,
  openNaverBlog,
  performCredentialLogin,
  verifyNaverLoggedIn,
} from "./naver-login.helper";

export interface LoginCheckResult {
  loggedIn: boolean;
  loginPageUrl: string;
  pageId: string;
}

export interface LoginManagerDeps {
  browser: BrowserManager;
  session: SessionManager;
  cookies: CookieManager;
}

export interface LoginOptions {
  accountId?: string;
  credentials?: NaverCredentials;
}

export interface CredentialLoginResult extends NaverLoginResult {
  pageId?: string;
}

/**
 * Naver Login Engine v1 — credential login, session/cookie restore, encrypted persistence.
 */
export class LoginManager implements NaverManager {
  constructor(private readonly deps: LoginManagerDeps) {}

  async initialize(context: NaverManagerContext): Promise<void> {
    void context;
    if (!this.deps.browser.isRunning()) {
      await this.deps.browser.launch({ headless: true });
    }
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    void context;
    return this.deps.browser.isRunning();
  }

  async execute(context: NaverManagerContext): Promise<void> {
    if (context.mock) {
      await this.executeMockLogin(context);
      return;
    }

    await this.ensureAuthenticated(context);
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async openLoginPage(): Promise<BrowserPageHandle> {
    try {
      return await this.deps.browser.createPage(NAVER_LOGIN_URL);
    } catch (error) {
      throw wrapNaverBrowserError(error);
    }
  }

  async checkLogin(pageId?: string): Promise<boolean> {
    if (this.deps.browser.isMockMode()) {
      return Boolean(pageId);
    }

    if (!pageId) {
      return false;
    }

    const page = this.deps.browser.getPage(pageId);

    if (!page) {
      return false;
    }

    try {
      return await verifyNaverLoggedIn(page);
    } catch (error) {
      throw wrapNaverBrowserError(error);
    }
  }

  async login(id: string, password: string, accountId = "env-default"): Promise<CredentialLoginResult> {
    try {
      if (!this.deps.browser.isRunning()) {
        await this.deps.browser.launch({ headless: true });
      }

      const loginPage = await this.deps.browser.createPage();
      const page = this.deps.browser.getPage(loginPage.id);

      if (!page) {
        throw new NaverLoginFailedError("로그인 페이지를 열지 못했습니다.");
      }

      await performCredentialLogin(page, id, password);

      if (await detectNaverCaptcha(page)) {
        throw new NaverLoginFailedError(
          "네이버 보안 문자(CAPTCHA)가 필요합니다. 브라우저에서 수동 로그인 후 다시 시도해 주세요.",
        );
      }

      if (await detectNaverTwoFactor(page)) {
        throw new NaverTwoFactorRequiredError();
      }

      const loginError = await detectNaverLoginFailure(page);

      if (loginError) {
        throw new NaverLoginFailedError(loginError);
      }

      await openNaverBlog(page);

      if (!(await verifyNaverLoggedIn(page))) {
        throw new NaverLoginFailedError("네이버 로그인에 실패했습니다. 계정 정보를 확인해 주세요.");
      }

      const session = await this.persistAuthenticatedState({
        accountId,
        browserId: this.deps.browser.getActiveBrowser()!.id,
        pageId: loginPage.id,
        mock: false,
      });

      return {
        success: true,
        sessionId: session.id,
        pageId: loginPage.id,
        message: "네이버 로그인에 성공했습니다.",
        mock: false,
      };
    } catch (error) {
      if (
        error instanceof NaverLoginFailedError ||
        error instanceof NaverTwoFactorRequiredError ||
        error instanceof NaverSessionExpiredError
      ) {
        return {
          success: false,
          sessionId: null,
          message: error.message,
          mock: false,
        };
      }

      const wrapped = wrapNaverBrowserError(error);

      return {
        success: false,
        sessionId: null,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async logout(sessionId: string): Promise<void> {
    const session = this.deps.session.get(sessionId);

    if (session) {
      await this.deps.cookies.clear(sessionId);
      await this.deps.session.destroy(sessionId);
    }
  }

  async validateSession(sessionId: string): Promise<boolean> {
    return this.deps.session.validateSession(sessionId);
  }

  async checkLoginStatus(pageId?: string): Promise<LoginCheckResult> {
    const loginPage = pageId
      ? {
          id: pageId,
          url: NAVER_LOGIN_URL,
          browserId: "",
          mock: this.deps.browser.isMockMode(),
        }
      : await this.openLoginPage();

    const loggedIn = await this.checkLogin(loginPage.id);

    return {
      loggedIn,
      loginPageUrl: loginPage.url,
      pageId: loginPage.id,
    };
  }

  async ensureLogin(options: LoginOptions = {}): Promise<CredentialLoginResult> {
    const accountId = options.accountId ?? "env-default";

    if (this.deps.browser.isMockMode()) {
      return this.runMockLogin(accountId);
    }

    if (!this.deps.browser.isRunning()) {
      await this.deps.browser.launch({ headless: true });
    }

    const restoreContext: NaverManagerContext = {
      accountId,
      mock: false,
    };

    if (await this.tryRestoreSession(restoreContext, accountId)) {
      return {
        success: true,
        sessionId: restoreContext.sessionId ?? null,
        pageId: restoreContext.pageId ?? undefined,
        message: "기존 세션 사용",
        mock: false,
      };
    }

    return this.loginWithOptions(options);
  }

  async loginWithOptions(options: LoginOptions = {}): Promise<CredentialLoginResult> {
    if (this.deps.browser.isMockMode()) {
      return this.runMockLogin(options.accountId ?? "env-default");
    }

    const credentials = this.resolveCredentials(options);

    if (!credentials?.username || !credentials.password) {
      return {
        success: false,
        sessionId: null,
        message: "네이버 계정 정보가 없습니다.",
        mock: false,
      };
    }

    return this.login(credentials.username, credentials.password, credentials.accountId);
  }

  private async ensureAuthenticated(context: NaverManagerContext): Promise<void> {
    const accountId = context.accountId ?? "env-default";

    if (await this.tryRestoreSession(context, accountId)) {
      return;
    }

    const credentials = this.resolveCredentials({ accountId: context.accountId });

    if (!credentials?.username || !credentials.password) {
      throw new NaverLoginFailedError("네이버 계정 정보가 없습니다.");
    }

    const result = await this.login(
      credentials.username,
      credentials.password,
      credentials.accountId,
    );

    if (!result.success || !result.sessionId) {
      throw new NaverLoginFailedError(result.message);
    }

    context.sessionId = result.sessionId;
    context.pageId = result.pageId ?? context.pageId;
    context.loggedIn = true;
    context.loginPageUrl = NAVER_BLOG_URL;
  }

  private async tryRestoreSession(
    context: NaverManagerContext,
    accountId: string,
  ): Promise<boolean> {
    const restored = await this.deps.session.restoreSession(accountId);

    if (restored && !(await this.deps.session.validateSession(restored.id))) {
      this.deps.session.invalidate(restored.id);
    }

    const cookieApplied = await this.deps.cookies.applyToBrowser(
      accountId,
      (cookies) => this.deps.browser.addCookies(cookies),
    );

    if (!cookieApplied && !restored) {
      return false;
    }

    const page = await this.deps.browser.createPage(NAVER_BLOG_URL);
    context.pageId = page.id;
    context.loginPageUrl = page.url;

    if (!(await this.checkLogin(page.id))) {
      if (restored) {
        this.deps.session.invalidate(restored.id);
        await this.deps.cookies.clearByAccount(accountId);
      }

      return false;
    }

    const browser = this.deps.browser.getActiveBrowser();

    if (!browser) {
      throw new NaverLoginFailedError("브라우저가 실행 중이 아닙니다.");
    }

    const session =
      restored ??
      (await this.persistAuthenticatedState({
        accountId,
        browserId: browser.id,
        pageId: page.id,
        mock: false,
      }));

    if (restored) {
      this.deps.session.touch(restored.id);
      const playwrightPage = this.deps.browser.getPage(page.id);

      if (playwrightPage) {
        const cookies = toNaverCookies(await playwrightPage.context().cookies());
        await this.deps.cookies.refreshCookies(session.id, cookies);
      }
    }

    context.sessionId = session.id;
    context.loggedIn = true;
    return true;
  }

  private async persistAuthenticatedState(input: {
    accountId: string;
    browserId: string;
    pageId: string;
    mock: boolean;
  }): Promise<NaverSession> {
    const page = this.deps.browser.getPage(input.pageId);

    if (!page) {
      throw new NaverLoginFailedError("로그인 상태를 저장하지 못했습니다.");
    }

    const cookies = toNaverCookies(await page.context().cookies());
    const session = this.deps.session.create({
      accountId: input.accountId,
      browserId: input.browserId,
      pageId: input.pageId,
      mock: input.mock,
    });

    await this.deps.cookies.saveCookies(input.accountId, cookies, session.id, input.mock);
    await this.deps.session.saveSession(input.accountId, session);

    return session;
  }

  private async runMockLogin(accountId: string): Promise<CredentialLoginResult> {
    const context: NaverManagerContext = {
      accountId,
      mock: true,
    };

    await this.executeMockLogin(context);

    return {
      success: true,
      sessionId: context.sessionId ?? null,
      pageId: context.pageId ?? undefined,
      message: "Mock 로그인 성공",
      mock: true,
    };
  }

  private async executeMockLogin(context: NaverManagerContext): Promise<void> {
    const accountId = context.accountId ?? "env-default";
    const browser = await this.deps.browser.launch({ headless: true });
    const page = await this.openLoginPage();

    const session = this.deps.session.create({
      accountId,
      browserId: browser.id,
      pageId: page.id,
      mock: true,
    });

    await this.deps.cookies.saveCookies(
      accountId,
      [
        {
          name: "NID_AUT",
          value: "mock-auth-token",
          domain: ".naver.com",
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "Lax",
        },
      ],
      session.id,
      true,
    );

    context.pageId = page.id;
    context.loginPageUrl = page.url;
    context.sessionId = session.id;
    context.loggedIn = true;
  }

  private resolveCredentials(options: LoginOptions): NaverAccountCredentials | null {
    if (options.accountId) {
      return naverAccountRegistry.getCredentials(options.accountId);
    }

    if (options.credentials?.username && options.credentials.password) {
      return {
        accountId: `inline-${options.credentials.username}`,
        username: options.credentials.username,
        password: options.credentials.password,
      };
    }

    const envUsername = process.env.NAVER_USERNAME?.trim();
    const envPassword = process.env.NAVER_PASSWORD?.trim();

    if (envUsername && envPassword) {
      return {
        accountId: "env-default",
        username: envUsername,
        password: envPassword,
      };
    }

    const accounts = naverAccountRegistry.list();

    if (accounts.length === 0) {
      return null;
    }

    return naverAccountRegistry.getCredentials(accounts[0].id);
  }
}

export const loginManager = new LoginManager({
  browser: browserManager,
  session: sessionManager,
  cookies: cookieManager,
});
