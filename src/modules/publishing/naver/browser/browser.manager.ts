import { randomUUID } from "crypto";
import type { Browser, BrowserContext, Cookie, Page } from "playwright";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import { resolveNaverBrowserMode } from "../managers/naver-manager.types";
import {
  createMockBrowserState,
  createMockPage,
  disposeMockBrowserState,
  navigateMockPage,
  type MockBrowserState,
} from "./mock-browser.state";
import type {
  BrowserHealthCheckResult,
  BrowserInstance,
  BrowserLaunchOptions,
  BrowserManagerConfig,
  BrowserPageHandle,
} from "./browser.types";

type PlaywrightModule = typeof import("playwright");

/**
 * Playwright browser lifecycle — Mock Browser / Playwright dual mode.
 */
export class BrowserManager implements NaverManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private instance: BrowserInstance | null = null;
  private pages = new Map<string, Page>();
  private mockState: MockBrowserState | null = null;

  constructor(private readonly config: BrowserManagerConfig = {}) {}

  isMockMode(): boolean {
    return resolveNaverBrowserMode() === "mock";
  }

  async initialize(context: NaverManagerContext): Promise<void> {
    void context;
    await this.launch();
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    void context;
    return this.isRunning();
  }

  async execute(context: NaverManagerContext): Promise<void> {
    if (!this.isRunning()) {
      await this.launch();
    }

    const health = await this.healthCheck();

    if (!health.healthy) {
      throw new Error(health.message);
    }

    context.browserId = this.instance?.id ?? null;
    context.browserHealthy = health.healthy;
    context.mock = this.isMockMode();
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    void context;
    await this.close();
  }

  async launch(options: BrowserLaunchOptions = {}): Promise<BrowserInstance> {
    if (this.instance) {
      return this.instance;
    }

    if (this.isMockMode()) {
      this.mockState = createMockBrowserState(
        options.headless ?? this.config.defaultLaunchOptions?.headless ?? true,
      );
      this.instance = this.mockState.instance;
      return this.instance;
    }

    const headless =
      options.headless ?? this.config.defaultLaunchOptions?.headless ?? true;
    const slowMo = options.slowMo ?? this.config.defaultLaunchOptions?.slowMo;
    const viewport = options.viewport ??
      this.config.defaultLaunchOptions?.viewport ?? { width: 1280, height: 900 };

    const { chromium } = await this.loadPlaywright();

    this.browser = await chromium.launch({
      headless,
      slowMo,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
      ],
    });

    this.context = await this.browser.newContext({
      viewport,
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });

    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    this.instance = {
      id: randomUUID(),
      launchedAt: new Date(),
      headless,
      mock: false,
    };

    return this.instance;
  }

  getActiveBrowser(): BrowserInstance | null {
    return this.instance;
  }

  async getContext(): Promise<BrowserContext> {
    if (this.isMockMode()) {
      throw new Error("Mock Browser 모드에서는 Playwright context를 사용할 수 없습니다.");
    }

    if (!this.context) {
      await this.launch();
    }

    if (!this.context) {
      throw new Error("Playwright browser context를 시작하지 못했습니다.");
    }

    return this.context;
  }

  async createPage(url = "about:blank"): Promise<BrowserPageHandle> {
    const browser = this.getActiveBrowser();

    if (!browser) {
      throw new Error("브라우저가 실행 중이 아닙니다.");
    }

    if (this.isMockMode() && this.mockState) {
      return createMockPage(this.mockState, url);
    }

    const context = await this.getContext();
    const page = await context.newPage();

    if (url !== "about:blank") {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    }

    const handle: BrowserPageHandle = {
      id: randomUUID(),
      browserId: browser.id,
      url: page.url(),
      mock: false,
    };

    this.pages.set(handle.id, page);
    return handle;
  }

  getPage(pageId: string): Page | null {
    return this.pages.get(pageId) ?? null;
  }

  registerPage(pageId: string, page: Page): void {
    this.pages.set(pageId, page);
  }

  async getActivePage(): Promise<Page | null> {
    if (this.isMockMode()) {
      return null;
    }

    try {
      const context = await this.getContext();
      const openPages = context.pages().filter((item) => !item.isClosed());
      return openPages.length > 0 ? openPages[openPages.length - 1]! : null;
    } catch {
      return null;
    }
  }

  resolvePage(pageId?: string): Page | null {
    if (pageId) {
      const cached = this.pages.get(pageId);

      if (cached && !cached.isClosed()) {
        return cached;
      }
    }

    return null;
  }

  async navigate(pageId: string, url: string): Promise<BrowserPageHandle> {
    const browser = this.getActiveBrowser();

    if (!browser) {
      throw new Error("브라우저가 실행 중이 아닙니다.");
    }

    if (this.isMockMode() && this.mockState) {
      return navigateMockPage(this.mockState, pageId, url);
    }

    const page = this.pages.get(pageId);

    if (!page) {
      throw new Error("브라우저 페이지를 찾을 수 없습니다.");
    }

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });

    return {
      id: pageId,
      browserId: browser.id,
      url: page.url(),
      mock: false,
    };
  }

  async addCookies(cookies: Cookie[]): Promise<void> {
    if (this.isMockMode()) {
      return;
    }

    const context = await this.getContext();
    await context.addCookies(cookies);
  }

  async extractCookies(urls?: string[]): Promise<Cookie[]> {
    if (this.isMockMode()) {
      return [];
    }

    const context = await this.getContext();
    return context.cookies(urls);
  }

  async close(): Promise<void> {
    if (this.isMockMode()) {
      disposeMockBrowserState(this.mockState);
      this.mockState = null;
      this.instance = null;
      return;
    }

    for (const page of this.pages.values()) {
      await page.close().catch(() => undefined);
    }

    this.pages.clear();

    if (this.context) {
      await this.context.close().catch(() => undefined);
      this.context = null;
    }

    if (this.browser) {
      await this.browser.close().catch(() => undefined);
      this.browser = null;
    }

    this.instance = null;
  }

  isRunning(): boolean {
    return this.isMockMode() ? this.mockState !== null : this.browser !== null;
  }

  async healthCheck(): Promise<BrowserHealthCheckResult> {
    if (!this.isRunning()) {
      return {
        healthy: false,
        running: false,
        mock: this.isMockMode(),
        message: "브라우저가 실행 중이 아닙니다.",
      };
    }

    if (this.isMockMode()) {
      return {
        healthy: true,
        running: true,
        mock: true,
        message: "Mock Browser 정상",
      };
    }

    try {
      const context = await this.getContext();
      const pageCount = context.pages().length;

      return {
        healthy: true,
        running: true,
        mock: false,
        message: `Playwright Browser 정상 (${pageCount} pages)`,
      };
    } catch (error) {
      return {
        healthy: false,
        running: false,
        mock: false,
        message:
          error instanceof Error
            ? error.message
            : "Playwright Browser 상태 확인에 실패했습니다.",
      };
    }
  }

  private async loadPlaywright(): Promise<PlaywrightModule> {
    return import("playwright");
  }
}

export const browserManager = new BrowserManager();
