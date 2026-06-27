import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Frame, Locator, Page } from "playwright";
import type { BrowserManager } from "../browser/browser.manager";
import { browserManager } from "../browser/browser.manager";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import { wrapNaverBrowserError } from "../login/naver-login.errors";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import {
  convertMarkdownToNaverHtml,
  markdownToPlainText,
} from "./markdown-to-naver.converter";
import {
  getMockEditorInput,
  setMockEditorContent,
  setMockEditorHashtags,
  setMockEditorTitle,
} from "./mock-editor.state";
import {
  inputNaverEditorHashtags,
  normalizeEditorText,
  readNaverEditorHashtags,
} from "./naver-editor-input.helper";
import { getSelectorList } from "../selectors/naver-selector.registry";
import {
  buildNaverEditorWriteUrlCandidates,
  getPrimaryEditorWriteUrl,
  NAVER_EDITOR_WRITE_URL_PATTERN,
} from "./naver-editor.config";
import {
  formatFailureDiagnosis,
  playwrightDebugSession,
} from "../playwright/playwright-debug";
import {
  detectNaverEditor,
  dismissNaverEditorPopups,
  enterNaverBlogEditor,
  inspectNaverEditor,
  isNaverEditorErrorPage,
  isNaverEditorUrl,
  isNaverLoginRedirect,
  waitForNaverEditorReady,
} from "./naver-editor.helper";
import { logEditorInputTrace } from "./editor-input-step-logger";
import {
  EDITOR_FRAME_URL_PATTERN,
  editorSession,
} from "./editor-session";
import {
  NaverEditorAccessError,
  NaverEditorNotReadyError,
  NaverEditorValidationError,
} from "./naver-editor.errors";
import type {
  EditorAccessResult,
  EditorContentExpected,
  EditorContentValidateResult,
  EditorFillResult,
  EditorInputResult,
  EditorOpenResult,
  EditorPrepareResult,
  EditorReadyResult,
  EditorStepDefinition,
  EditorStepHandler,
  EditorStepId,
  EditorValidateResult,
} from "./editor.types";

const NAVER_EDITOR_ROOT_SELECTORS = getSelectorList("editorRoot");
const PRIMARY_EDITOR_WRITE_URL = getPrimaryEditorWriteUrl();
const DEBUG_DIR = path.join(process.cwd(), "debug");

const TITLE_SELECTORS = [
  ".se-title-text .se-text-paragraph",
  ".se-documentTitle .se-text-paragraph",
];

const BODY_SELECTORS = [".se-component.se-text .se-text-paragraph"];

const VALIDATE_EDITOR_AUDIT_SELECTORS = [
  ".se-title-text",
  ".se-text-paragraph",
  ".se-component",
  ".se-module-text",
  "[contenteditable]",
  "textarea",
  "input",
] as const;

const VALIDATE_EDITOR_TITLE_SELECTOR =
  ".se-title-text .se-text-paragraph, .se-documentTitle .se-text-paragraph";
const VALIDATE_EDITOR_CONTENT_SELECTOR = ".se-component.se-text .se-text-paragraph";
const VALIDATE_EDITOR_ROOT_SELECTOR =
  ".se-title-text, .se-documentTitle, .se-main-container, .se-body";

const INPUT_MAX_ATTEMPTS = 3;

const DEFAULT_EDITOR_STEPS: EditorStepDefinition[] = [
  { id: "title", label: "제목 입력", selectorHint: ".se-title-text" },
  { id: "content", label: "본문 입력", selectorHint: ".se-main-container" },
  { id: "images", label: "이미지 업로드", selectorHint: ".se-image-toolbar-button" },
  { id: "tags", label: "태그 입력", selectorHint: ".tag_input" },
  { id: "publish", label: "발행 버튼 클릭", selectorHint: "button:has-text('발행')" },
];

export class EditorManager implements NaverManager {
  private readonly stepHandlers: Record<EditorStepId, EditorStepHandler>;
  private readonly pageRefs = new Map<string, Page>();

  constructor(private readonly browser: BrowserManager = browserManager) {
    this.stepHandlers = {
      title: async (context, publishPackage) => {
        void context;
        void publishPackage.title;
      },
      content: async (context, publishPackage) => {
        void context;
        void publishPackage.content;
      },
      images: async (context, publishPackage) => {
        void context;
        void publishPackage.images;
      },
      tags: async (context, publishPackage) => {
        void context;
        void publishPackage.hashtags;
      },
      publish: async () => {
        /* preparation only — 실제 발행 버튼 클릭 없음 */
      },
    };
  }

  getStepDefinitions(): EditorStepDefinition[] {
    return DEFAULT_EDITOR_STEPS;
  }

  async initialize(context: NaverManagerContext): Promise<void> {
    if (!context.browserId) {
      throw new Error("EditorManager 초기화에 browserId가 필요합니다.");
    }
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    return Boolean(context.publishPackage?.title?.trim()) && Boolean(context.pageId);
  }

  async execute(context: NaverManagerContext): Promise<void> {
    void context;
    context.editorPrepared = false;
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async openEditor(pageId?: string): Promise<EditorOpenResult> {
    let activePage: Page | null = null;

    try {
      if (!this.browser.isRunning()) {
        await this.browser.launch({
          headless: process.env.NAVER_EDITOR_HEADLESS !== "false",
        });
      }

      if (this.browser.isMockMode()) {
        const page = pageId
          ? { id: pageId, url: PRIMARY_EDITOR_WRITE_URL, browserId: "", mock: true }
          : await this.browser.createPage(PRIMARY_EDITOR_WRITE_URL);

        return {
          success: true,
          pageId: page.id,
          editorUrl: PRIMARY_EDITOR_WRITE_URL,
          message: "Mock 에디터 페이지를 열었습니다.",
          mock: true,
        };
      }

      activePage = await this.getActiveContextPage();
      const loginUrlBeforeNavigate = activePage?.url() ?? null;

      let resolved = await this.resolvePlaywrightPage(pageId);
      await playwrightDebugSession.startTrace(resolved.page);
      let navigation: Awaited<ReturnType<EditorManager["navigateToEditor"]>>;

      try {
        navigation = await this.navigateToEditor(resolved.page);
        resolved.page = navigation.page;
        this.pageRefs.set(resolved.pageId, navigation.page);
        this.browser.registerPage(resolved.pageId, navigation.page);
      } catch {
        resolved = await this.createFreshContextPage(pageId);
        activePage = resolved.page;
        navigation = await this.navigateToEditor(resolved.page);
        resolved.page = navigation.page;
        this.pageRefs.set(resolved.pageId, navigation.page);
        this.browser.registerPage(resolved.pageId, navigation.page);
      }

      const usesIframe = Boolean(await this.syncEditorMainFrame(resolved.pageId, navigation.page));

      return {
        success: true,
        pageId: resolved.pageId,
        editorUrl: navigation.finalUrl,
        message: [
          "네이버 블로그 글쓰기 페이지로 이동했습니다.",
          `loginUrl=${loginUrlBeforeNavigate ?? navigation.initialUrl}`,
          `finalUrl=${navigation.finalUrl}`,
          `redirected=${navigation.redirected}`,
          `iframe=${usesIframe}`,
        ].join(" | "),
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      activePage = activePage ?? (await this.getActiveContextPage());

      if (activePage) {
        const diagnosis = await playwrightDebugSession.saveArtifacts(
          activePage,
          "openEditor",
          error,
        );

        if (diagnosis) {
          console.error(formatFailureDiagnosis(diagnosis));
        }
      }

      return {
        success: false,
        pageId: pageId ?? null,
        editorUrl: activePage?.url() ?? null,
        message: wrapped.message,
        mock: this.browser.isMockMode(),
      };
    }
  }

  async ensureEditorReady(pageId?: string): Promise<EditorOpenResult> {
    if (this.browser.isMockMode()) {
      if (pageId) {
        const validated = await this.validateEditor(pageId);

        if (validated.valid) {
          return {
            success: true,
            pageId: validated.pageId,
            editorUrl: validated.editorUrl,
            message: "Mock 에디터 세션 재사용",
            mock: true,
          };
        }
      }

      return this.openEditor(pageId);
    }

    let targetPageId = pageId ?? null;
    let page: Page | null = null;

    if (this.browser.isRunning()) {
      page = await this.getActiveContextPage();

      if (page) {
        const resolved = await this.resolvePlaywrightPage(pageId);
        targetPageId = resolved.pageId;
        page = resolved.page;
      }
    }

    const cachedFrame =
      targetPageId !== null ? editorSession.get(targetPageId).mainFrame : null;
    const hasValidMainFrame =
      cachedFrame !== null &&
      !cachedFrame.isDetached() &&
      EDITOR_FRAME_URL_PATTERN.test(cachedFrame.url());

    let openedEditor = false;

    if (!hasValidMainFrame && page && targetPageId) {
      const liveFrame = await this.resolveEditorFrame(page);

      if (liveFrame) {
        editorSession.setMainFrame(targetPageId, liveFrame);
        await dismissNaverEditorPopups(page);
        await this.waitForEditorRootSelectors(page, 10_000).catch(() => null);

        const liveValidated = await this.validateEditor(targetPageId);

        if (liveValidated.valid) {
          return {
            success: true,
            pageId: liveValidated.pageId,
            editorUrl: liveValidated.editorUrl,
            message: "기존 에디터 세션 재사용",
            mock: false,
          };
        }
      }
    }

    if (!hasValidMainFrame) {
      const opened = await this.openEditor(pageId);
      openedEditor = true;

      if (!opened.success || !opened.pageId) {
        return opened;
      }

      targetPageId = opened.pageId;
      const resolved = await this.resolvePlaywrightPage(opened.pageId);
      page = resolved.page;

      const frame = await this.resolveEditorFrame(page);
      editorSession.setMainFrame(targetPageId, frame);
    } else if (page && targetPageId) {
      const frame = await this.resolveEditorFrame(page);
      editorSession.setMainFrame(targetPageId, frame);
    }

    if (!targetPageId || !page) {
      return {
        success: false,
        pageId: targetPageId,
        editorUrl: null,
        message: "에디터 페이지를 찾을 수 없습니다.",
        mock: false,
      };
    }

    const validated = await this.validateEditor(targetPageId);

    if (validated.valid) {
      return {
        success: true,
        pageId: validated.pageId,
        editorUrl: validated.editorUrl,
        message:
          hasValidMainFrame && !openedEditor
            ? "기존 에디터 세션 재사용"
            : "에디터 준비 완료",
        mock: false,
      };
    }

    return {
      success: false,
      pageId: targetPageId,
      editorUrl: page.url(),
      message: validated.message,
      mock: false,
    };
  }

  async waitEditorReady(pageId: string, timeoutMs = 60_000): Promise<EditorReadyResult> {
    if (this.browser.isMockMode()) {
      return {
        ready: true,
        pageId,
        editorUrl: PRIMARY_EDITOR_WRITE_URL,
        context: "page",
        message: "Mock 에디터 준비 완료",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;

    try {
      await dismissNaverEditorPopups(page);
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);
      await this.waitForEditorRootSelectors(page, timeoutMs);

      const detection = await waitForNaverEditorReady(page, timeoutMs);

      if (!detection.found) {
        const diagnosis = await playwrightDebugSession.saveArtifacts(
          page,
          "waitEditorReady",
          new Error(detection.reason ?? "에디터 로딩 실패"),
        );

        if (diagnosis) {
          console.error(formatFailureDiagnosis(diagnosis));
        }
      }

      return {
        ready: detection.found,
        pageId: resolved.pageId,
        editorUrl: page.url(),
        context: detection.found ? detection.context : null,
        message: detection.found
          ? "네이버 블로그 에디터 로딩 완료"
          : detection.reason ?? "에디터 로딩에 실패했습니다.",
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      const diagnosis = await playwrightDebugSession.saveArtifacts(page, "waitEditorReady", error);

      if (diagnosis) {
        console.error(formatFailureDiagnosis(diagnosis));
      }

      return {
        ready: false,
        pageId: resolved.pageId,
        editorUrl: page.url(),
        context: null,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async validateEditor(pageId: string): Promise<EditorValidateResult> {
    if (this.browser.isMockMode()) {
      return {
        valid: true,
        pageId,
        editorUrl: PRIMARY_EDITOR_WRITE_URL,
        context: "page",
        message: "Mock 에디터 검증 성공",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;

    try {
      await this.syncEditorMainFrame(resolved.pageId, page);
      await this.logValidateEditorSelectorCounts(resolved.pageId, page);
      const result = await this.detectEditorForValidate(resolved.pageId, page);

      if (!result.valid) {
        const diagnosis = await playwrightDebugSession.saveArtifacts(
          page,
          "validateEditor",
          new Error(result.reason ?? "에디터 검증에 실패했습니다."),
        );

        if (diagnosis) {
          console.error(formatFailureDiagnosis(diagnosis));
        }
      }

      await playwrightDebugSession.stopTrace();

      return {
        valid: result.valid,
        pageId: resolved.pageId,
        editorUrl: page.url(),
        context: result.context,
        message: result.valid
          ? "네이버 블로그 에디터 접근 성공"
          : result.reason ?? "에디터 검증에 실패했습니다.",
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      const diagnosis = await playwrightDebugSession.saveArtifacts(page, "validateEditor", error);

      if (diagnosis) {
        console.error(formatFailureDiagnosis(diagnosis));
      }

      return {
        valid: false,
        pageId: resolved.pageId,
        editorUrl: page.url(),
        context: null,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  private async logAllFrames(page: Page, label: string): Promise<void> {
    const frames = page.frames();
    console.log(`EditorSession — ${label} Frame Count=${frames.length}`);

    for (const frame of frames) {
      const title = await frame.evaluate(() => document.title).catch(() => "unknown");
      console.log(
        `EditorSession — Frame url=${frame.url()} name=${frame.name()} title=${title}`,
      );
    }
  }

  private logSelectedFrame(pageId: string): void {
    const frame = editorSession.get(pageId).mainFrame;

    if (!frame) {
      console.log("EditorSession — Selected Frame URL=none Selected Frame Name=none");
      return;
    }

    console.log(
      `EditorSession — Selected Frame URL=${frame.url()} Selected Frame Name=${frame.name()}`,
    );
  }

  private logFrameList(page: Page): void {
    const frames = page.frames();
    console.log(`resolveEditorFrame — Frame Count=${frames.length}`);

    for (const frame of frames) {
      console.log(`resolveEditorFrame — Frame url=${frame.url()} name=${frame.name()}`);
    }
  }

  private async resolveEditorFrame(page: Page): Promise<Frame | null> {
    for (const frame of page.frames()) {
      const frameUrl = frame.url();

      if (EDITOR_FRAME_URL_PATTERN.test(frameUrl)) {
        console.log(
          `resolveEditorFrame — selected url=${frameUrl} name=${frame.name()}`,
        );
        return frame;
      }
    }

    this.logFrameList(page);
    return null;
  }

  private async syncEditorMainFrame(pageId: string, page: Page): Promise<Frame | null> {
    await this.logAllFrames(page, "openEditor");

    const frame = await this.resolveEditorFrame(page);
    editorSession.setMainFrame(pageId, frame);
    this.logSelectedFrame(pageId);

    return frame;
  }

  private async getEditorRoot(pageId: string, page: Page): Promise<Frame | Page> {
    const cached = editorSession.get(pageId).mainFrame;

    if (cached && !cached.isDetached() && EDITOR_FRAME_URL_PATTERN.test(cached.url())) {
      return cached;
    }

    const frame = await this.resolveEditorFrame(page);
    editorSession.setMainFrame(pageId, frame);

    return frame ?? page;
  }

  private async logValidateEditorSelectorCounts(pageId: string, page: Page): Promise<void> {
    const editorFrame = await this.resolveEditorFrame(page);
    editorSession.setMainFrame(pageId, editorFrame);

    console.log("validateEditor — searchContext=page (page.locator)");

    for (const selector of VALIDATE_EDITOR_AUDIT_SELECTORS) {
      const locator = page.locator(selector);
      const count = await locator.count();
      const outerHTML =
        count > 0
          ? await locator
              .first()
              .evaluate((el) => el.outerHTML.slice(0, 500))
              .catch(() => "")
          : "";

      console.log(`validateEditor — [page] ${selector} count=${count}`);
      console.log(`validateEditor — [page] ${selector} outerHTML(first)=${outerHTML}`);
    }

    if (!editorFrame) {
      console.log("validateEditor — searchContext=iframe (EditorSession.mainFrame 없음)");
      return;
    }

    console.log("validateEditor — searchContext=iframe (EditorSession.mainFrame)");

    for (const selector of VALIDATE_EDITOR_AUDIT_SELECTORS) {
      const locator = editorFrame.locator(selector);
      const count = await locator.count();
      const outerHTML =
        count > 0
          ? await locator
              .first()
              .evaluate((el) => el.outerHTML.slice(0, 500))
              .catch(() => "")
          : "";

      console.log(`validateEditor — [iframe/EditorSession.mainFrame] ${selector} count=${count}`);
      console.log(
        `validateEditor — [iframe/EditorSession.mainFrame] ${selector} outerHTML(first)=${outerHTML}`,
      );
    }
  }

  private async detectEditorForValidate(
    pageId: string,
    page: Page,
  ): Promise<{
    valid: boolean;
    context: "mainFrame" | "page" | null;
    reason: string | null;
  }> {
    const url = page.url();

    if (isNaverLoginRedirect(url)) {
      return {
        valid: false,
        context: null,
        reason: "로그인 페이지로 리다이렉트되었습니다. 세션이 만료되었을 수 있습니다.",
      };
    }

    if (await isNaverEditorErrorPage(page)) {
      return {
        valid: false,
        context: null,
        reason: "블로그 ID 없이 에디터 URL 접근 — 오류 페이지",
      };
    }

    const editorFrame = await this.resolveEditorFrame(page);
    editorSession.setMainFrame(pageId, editorFrame);

    if (editorFrame) {
      const titleCount = await editorFrame.locator(VALIDATE_EDITOR_TITLE_SELECTOR).count();
      const contentCount = await editorFrame.locator(VALIDATE_EDITOR_CONTENT_SELECTOR).count();
      const rootCount = await editorFrame.locator(VALIDATE_EDITOR_ROOT_SELECTOR).count();

      console.log(
        `validateEditor — detectionContext=EditorSession.mainFrame title=${titleCount} content=${contentCount} root=${rootCount}`,
      );

      if (titleCount > 0 || contentCount > 0 || rootCount > 0) {
        return { valid: true, context: "mainFrame", reason: null };
      }
    }

    const pageTitleCount = await page.locator(VALIDATE_EDITOR_TITLE_SELECTOR).count();
    const pageContentCount = await page.locator(VALIDATE_EDITOR_CONTENT_SELECTOR).count();
    const pageRootCount = await page.locator(VALIDATE_EDITOR_ROOT_SELECTOR).count();

    console.log(
      `validateEditor — detectionContext=page title=${pageTitleCount} content=${pageContentCount} root=${pageRootCount}`,
    );

    if (pageTitleCount > 0 || pageContentCount > 0 || pageRootCount > 0) {
      return { valid: true, context: "page", reason: null };
    }

    return {
      valid: false,
      context: null,
      reason: "SmartEditor DOM(제목/본문)을 찾을 수 없습니다.",
    };
  }

  async accessEditor(pageId?: string): Promise<EditorAccessResult> {
    const opened = await this.openEditor(pageId);

    if (!opened.success || !opened.pageId) {
      return {
        success: false,
        pageId: opened.pageId,
        editorUrl: opened.editorUrl,
        context: null,
        message: opened.message,
        mock: opened.mock,
      };
    }

    const ready = await this.waitEditorReady(opened.pageId);

    if (!ready.ready) {
      return {
        success: false,
        pageId: opened.pageId,
        editorUrl: ready.editorUrl,
        context: ready.context,
        message: ready.message,
        mock: ready.mock,
      };
    }

    const validated = await this.validateEditor(opened.pageId);

    return {
      success: validated.valid,
      pageId: opened.pageId,
      editorUrl: validated.editorUrl,
      context: validated.context,
      message: validated.message,
      mock: validated.mock,
    };
  }

  async prepareEditor(context: NaverManagerContext): Promise<EditorPrepareResult> {
    const publishPackage = context.publishPackage;

    if (!publishPackage) {
      throw new Error("EditorManager에 PublishPackage가 필요합니다.");
    }

    const opened = await this.openEditor(context.pageId ?? undefined);

    if (!opened.success || !opened.pageId) {
      throw new NaverEditorAccessError(opened.message);
    }

    const ready = await this.waitEditorReady(opened.pageId);

    if (!ready.ready) {
      throw new NaverEditorNotReadyError(ready.message);
    }

    const validated = await this.validateEditor(opened.pageId);

    if (!validated.valid) {
      throw new NaverEditorValidationError(validated.message);
    }

    const plannedSteps: EditorStepId[] = [];

    for (const step of DEFAULT_EDITOR_STEPS) {
      if (step.id === "publish") {
        continue;
      }

      await this.stepHandlers[step.id](context, publishPackage);
      plannedSteps.push(step.id);
    }

    context.pageId = opened.pageId;
    context.editorPrepared = true;

    return {
      prepared: true,
      pageId: opened.pageId,
      plannedSteps,
      mock: context.mock,
    };
  }

  async setTitle(pageId: string, title: string): Promise<EditorInputResult> {
    const trimmed = title.trim();

    if (!trimmed) {
      return {
        success: false,
        pageId,
        message: "제목이 비어 있습니다.",
        mock: this.browser.isMockMode(),
      };
    }

    if (this.browser.isMockMode()) {
      setMockEditorTitle(pageId, trimmed);

      return {
        success: true,
        pageId,
        message: "Mock 제목 입력 완료",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;
    const expected = normalizeEditorText(trimmed);

    try {
      await dismissNaverEditorPopups(page);
      const actualRaw = await this.performTitleInput(resolved.pageId, page, trimmed);
      const actual = normalizeEditorText(actualRaw);
      const verified = actual.includes(expected);

      if (!verified) {
        throw new NaverEditorAccessError(
          `제목 입력 검증 실패: expected="${trimmed}", actual="${actualRaw}"`,
        );
      }

      await this.saveEditorDebug(page, "setTitle");

      return {
        success: true,
        pageId: resolved.pageId,
        message: "제목 입력 완료",
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      await this.saveEditorDebug(page, "setTitle", error);

      return {
        success: false,
        pageId: resolved.pageId,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async setContent(pageId: string, content: string): Promise<EditorInputResult> {
    const trimmed = content.trim();

    if (!trimmed) {
      return {
        success: false,
        pageId,
        message: "본문이 비어 있습니다.",
        mock: this.browser.isMockMode(),
      };
    }

    const naverHtml = convertMarkdownToNaverHtml(trimmed);
    const plainText = markdownToPlainText(trimmed);

    if (this.browser.isMockMode()) {
      setMockEditorContent(pageId, naverHtml, plainText);

      return {
        success: true,
        pageId,
        message: "Mock 본문 입력 완료",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;
    const expected = normalizeEditorText(plainText);
    const minLength = Math.max(1, Math.floor(expected.length * 0.9));
    let lastActual = "";

    for (let attempt = 1; attempt <= INPUT_MAX_ATTEMPTS; attempt += 1) {
      try {
        await dismissNaverEditorPopups(page);
        const actualRaw = await this.performContentInput(resolved.pageId, page, plainText);
        lastActual = actualRaw;
        const actual = normalizeEditorText(actualRaw);
        const verified = actual.length >= minLength;

        if (verified) {
          return {
            success: true,
            pageId: resolved.pageId,
            message: "본문 입력 완료",
            mock: false,
          };
        }

        if (attempt < INPUT_MAX_ATTEMPTS) {
          await page.waitForTimeout(500 * attempt);
        }
      } catch (error) {
        const wrapped = wrapNaverBrowserError(error);

        if (attempt >= INPUT_MAX_ATTEMPTS) {
          await this.saveEditorDebug(page, "setContent", error);

          return {
            success: false,
            pageId: resolved.pageId,
            message: wrapped.message,
            mock: false,
          };
        }

        await page.waitForTimeout(500 * attempt);
      }
    }

    await this.saveEditorDebug(page, "setContent");

    return {
      success: false,
      pageId: resolved.pageId,
      message: `본문 입력 검증 실패: length=${normalizeEditorText(lastActual).length}, expected>=${minLength}`,
      mock: false,
    };
  }

  async setHashtags(pageId: string, hashtags: string[]): Promise<EditorInputResult> {
    const normalized = hashtags
      .map((tag) => tag.replace(/^#/, "").trim())
      .filter(Boolean);

    if (this.browser.isMockMode()) {
      setMockEditorHashtags(pageId, normalized);

      return {
        success: true,
        pageId,
        message: normalized.length
          ? "Mock 해시태그 입력 완료"
          : "입력할 해시태그가 없습니다.",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;

    if (normalized.length === 0) {
      return {
        success: true,
        pageId: resolved.pageId,
        message: "입력할 해시태그가 없습니다.",
        mock: false,
      };
    }

    try {
      await dismissNaverEditorPopups(page);
      await inputNaverEditorHashtags(page, normalized);

      return {
        success: true,
        pageId: resolved.pageId,
        message: "해시태그 입력 완료",
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);

      return {
        success: false,
        pageId: resolved.pageId,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async validateContent(
    pageId: string,
    expected: EditorContentExpected,
  ): Promise<EditorContentValidateResult> {
    const expectedPlain = markdownToPlainText(expected.content);
    const minLength = expected.minContentLength ?? Math.max(10, Math.floor(expectedPlain.length * 0.5));
    const missingFields: string[] = [];

    if (this.browser.isMockMode()) {
      const mockState = getMockEditorInput(pageId);
      const actualTitle = mockState?.title ?? "";
      const actualContent = mockState?.contentPlain ?? "";
      const actualTags = mockState?.hashtags ?? [];

      const titleEntered = normalizeEditorText(actualTitle).includes(
        normalizeEditorText(expected.title),
      );
      const contentEntered = actualContent.length > 0;
      const contentLengthOk = actualContent.length >= minLength;
      const hashtagsEntered =
        expected.hashtags.length === 0 ||
        expected.hashtags.every((tag) =>
          actualTags.some(
            (actual) =>
              actual.replace(/^#/, "") === tag.replace(/^#/, ""),
          ),
        );

      if (!titleEntered) missingFields.push("title");
      if (!contentEntered) missingFields.push("content");
      if (!contentLengthOk) missingFields.push("contentLength");
      if (!hashtagsEntered) missingFields.push("hashtags");

      const valid =
        titleEntered && contentEntered && contentLengthOk && hashtagsEntered;

      return {
        valid,
        pageId,
        titleEntered,
        contentEntered,
        contentLengthOk,
        hashtagsEntered,
        missingFields,
        actualTitle,
        actualContentLength: actualContent.length,
        expectedContentLength: expectedPlain.length,
        message: valid ? "Mock 에디터 입력 검증 성공" : `입력 누락: ${missingFields.join(", ")}`,
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;
    const stepStartedAt = Date.now();

    try {
      const actualTitle = normalizeEditorText(await this.readTitleDirect(resolved.pageId, page));
      const actualContent = normalizeEditorText(await this.readContentDirect(resolved.pageId, page));
      const actualTags =
        expected.hashtags.length > 0 ? await readNaverEditorHashtags(page) : [];

      const titleEntered = actualTitle.includes(normalizeEditorText(expected.title));
      const contentEntered = actualContent.length > 0;
      const contentLengthOk =
        actualContent.length >= minLength &&
        actualContent.includes(normalizeEditorText(expectedPlain));
      const hashtagsEntered =
        expected.hashtags.length === 0 ||
        expected.hashtags.every((tag) =>
          actualTags.some(
            (actual) =>
              actual.replace(/^#/, "") === tag.replace(/^#/, ""),
          ),
        );

      if (!titleEntered) missingFields.push("title");
      if (!contentEntered) missingFields.push("content");
      if (!contentLengthOk) missingFields.push("contentLength");
      if (!hashtagsEntered) missingFields.push("hashtags");

      const valid =
        titleEntered && contentEntered && contentLengthOk && hashtagsEntered;

      this.logEditorInputPhase("validateContent", {
        durationMs: Date.now() - stepStartedAt,
        input: `${expected.title} | len=${expectedPlain.length}`,
        actual: `${actualTitle} | len=${actualContent.length}`,
        verify: valid,
        message: valid
          ? "에디터 입력 검증 성공"
          : `입력 검증 실패: ${missingFields.join(", ")}`,
      });

      return {
        valid,
        pageId: resolved.pageId,
        titleEntered,
        contentEntered,
        contentLengthOk,
        hashtagsEntered,
        missingFields,
        actualTitle,
        actualContentLength: actualContent.length,
        expectedContentLength: expectedPlain.length,
        message: valid
          ? "에디터 입력 검증 성공"
          : `입력 검증 실패: ${missingFields.join(", ")}`,
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);

      return {
        valid: false,
        pageId: resolved.pageId,
        titleEntered: false,
        contentEntered: false,
        contentLengthOk: false,
        hashtagsEntered: false,
        missingFields: ["validation"],
        actualTitle: "",
        actualContentLength: 0,
        expectedContentLength: expectedPlain.length,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async fillPublishPackage(
    pageId: string,
    publishPackage: PublishPackage,
  ): Promise<EditorFillResult> {
    const titleResult = await this.setTitle(pageId, publishPackage.title);
    const contentResult = titleResult.success
      ? await this.setContent(pageId, publishPackage.content)
      : {
          success: false,
          pageId,
          message: "제목 입력 실패로 본문 입력을 건너뜁니다.",
          mock: titleResult.mock,
        };

    const hashtagsResult =
      titleResult.success && contentResult.success
        ? await this.setHashtags(pageId, publishPackage.hashtags)
        : {
            success: false,
            pageId,
            message: "이전 단계 실패로 해시태그 입력을 건너뜁니다.",
            mock: titleResult.mock,
          };

    const validation =
      titleResult.success && contentResult.success
        ? await this.validateContent(pageId, {
            title: publishPackage.title,
            content: publishPackage.content,
            hashtags: [],
          })
        : {
            valid: false,
            pageId,
            titleEntered: false,
            contentEntered: false,
            contentLengthOk: false,
            hashtagsEntered: false,
            missingFields: ["input"],
            actualTitle: "",
            actualContentLength: 0,
            expectedContentLength: markdownToPlainText(publishPackage.content).length,
            message: "입력 단계 실패로 검증을 건너뜁니다.",
            mock: titleResult.mock,
          };

    if (titleResult.success && contentResult.success) {
      const resolved = await this.resolvePlaywrightPage(pageId);
      await this.saveEditorDebug(resolved.page, validation.valid ? "fill-success" : "fill-validation-failed");
    }

    return {
      success: titleResult.success && contentResult.success && validation.valid,
      pageId,
      title: titleResult,
      content: contentResult,
      hashtags: hashtagsResult,
      validation,
      mock: titleResult.mock,
    };
  }

  /**
   * pageId는 캐시 키로만 사용합니다. 실제 Page는 BrowserContext에서 조회합니다.
   */
  private async getActiveContextPage(): Promise<Page | null> {
    try {
      const context = await this.browser.getContext();
      const openPages = context.pages().filter((item) => !item.isClosed());
      return openPages.length > 0 ? openPages[openPages.length - 1]! : null;
    } catch {
      return null;
    }
  }

  private syncCacheId(page: Page, cachePageId?: string): string {
    if (cachePageId) {
      return cachePageId;
    }

    for (const [id, cachedPage] of this.pageRefs.entries()) {
      if (cachedPage === page) {
        return id;
      }
    }

    return `ctx-${Date.now()}`;
  }

  private async resolvePlaywrightPage(
    cachePageId?: string,
  ): Promise<{ pageId: string; page: Page }> {
    const contextPage = await this.getActiveContextPage();

    if (contextPage) {
      const pageId = this.syncCacheId(contextPage, cachePageId);
      this.pageRefs.set(pageId, contextPage);
      this.browser.registerPage(pageId, contextPage);
      return { pageId, page: contextPage };
    }

    return this.createFreshContextPage(cachePageId);
  }

  private async createFreshContextPage(
    cachePageId?: string,
  ): Promise<{ pageId: string; page: Page }> {
    await this.browser.createPage();
    const page = await this.getActiveContextPage();

    if (!page) {
      throw new NaverEditorAccessError("에디터 페이지를 찾을 수 없습니다.");
    }

    const pageId = cachePageId ?? this.syncCacheId(page);
    this.pageRefs.set(pageId, page);
    this.browser.registerPage(pageId, page);
    return { pageId, page };
  }

  private async navigateToEditor(page: Page): Promise<{
    initialUrl: string;
    finalUrl: string;
    redirected: boolean;
    page: Page;
  }> {
    const initialUrl = page.url();
    const activePage = await enterNaverBlogEditor(page);

    await this.ensureWriteEditorFrame(activePage);
    await this.waitForEditorRootSelectors(activePage, 10_000);

    return {
      initialUrl,
      finalUrl: activePage.url(),
      redirected: initialUrl !== activePage.url(),
      page: activePage,
    };
  }

  async ensureWriteEditor(pageId: string): Promise<void> {
    const resolved = await this.resolvePlaywrightPage(pageId);
    await this.ensureWriteEditorFrame(resolved.page);
  }

  async saveDraft(pageId: string): Promise<EditorInputResult> {
    if (this.browser.isMockMode()) {
      return {
        success: true,
        pageId,
        message: "Mock 임시저장 완료",
        mock: true,
      };
    }

    const resolved = await this.resolvePlaywrightPage(pageId);
    const page = resolved.page;

    try {
      await this.ensureWriteEditor(resolved.pageId);
      const { tryNaverTempSave } = await import("../publish/naver-publish.helper");
      const result = await tryNaverTempSave(page);

      if (!result.success) {
        await this.saveEditorDebug(page, "saveDraft", new Error(result.message));
      }

      return {
        success: result.success,
        pageId: resolved.pageId,
        message: result.message,
        mock: false,
      };
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      await this.saveEditorDebug(page, "saveDraft", error);

      return {
        success: false,
        pageId: resolved.pageId,
        message: wrapped.message,
        mock: false,
      };
    }
  }

  async getEditorDiagnostics(pageId: string) {
    const resolved = await this.resolvePlaywrightPage(pageId);
    return inspectNaverEditor(resolved.page);
  }

  async saveDebugArtifacts(
    pageId: string,
    reason: string,
    success = false,
    finalizeTrace = true,
  ): Promise<void> {
    const resolved = await this.resolvePlaywrightPage(pageId);
    await playwrightDebugSession.saveArtifacts(
      resolved.page,
      reason,
      success ? undefined : new Error(reason),
      { finalizeTrace },
    );

    if (!finalizeTrace) {
      await playwrightDebugSession.startTrace(resolved.page);
    }
  }

  private async waitForEditorRootSelectors(page: Page, timeoutMs: number): Promise<void> {
    const waitMs = Math.min(timeoutMs, 10_000);
    const selectors = NAVER_EDITOR_ROOT_SELECTORS.filter(
      (selector) => selector !== "#mainFrame" && !selector.includes("iframe"),
    );

    const waitForRootAttached = (root: Page | Frame, selector: string): Promise<string> => {
      const locator = root.locator(selector).first();

      return (async () => {
        if ((await locator.count().catch(() => 0)) > 0) {
          console.log(`waitForEditorRootSelectors — attached ${selector} (count>0)`);
          return selector;
        }

        await locator.waitFor({ state: "attached", timeout: waitMs });
        console.log(`waitForEditorRootSelectors — attached ${selector}`);
        return selector;
      })();
    };

    const attachWaits: Promise<string>[] = [];

    const editorFrame = await this.resolveEditorFrame(page);

    if (editorFrame) {
      for (const selector of selectors) {
        attachWaits.push(waitForRootAttached(editorFrame, selector));
      }
    } else {
      attachWaits.push(
        page
          .waitForEvent("framenavigated", {
            predicate: (frame) => EDITOR_FRAME_URL_PATTERN.test(frame.url()),
            timeout: waitMs,
          })
          .then(async (frame) => {
            const matched = await Promise.any(
              selectors.map((selector) => waitForRootAttached(frame, selector)),
            );
            return matched;
          }),
      );
    }

    for (const selector of selectors) {
      attachWaits.push(waitForRootAttached(page, selector));
    }

    const matched = await Promise.any(attachWaits);
    console.log(`waitForEditorRootSelectors — ready selector=${matched}`);
  }

  private async hasMainFrame(page: Page): Promise<boolean> {
    return (await this.resolveEditorFrame(page)) !== null;
  }

  private async findAttachedLocator(
    root: Page | Frame,
    selectors: string[],
    timeoutMs = 8_000,
  ): Promise<Locator | null> {
    for (const selector of selectors) {
      const locator = root.locator(selector).first();

      if ((await locator.count().catch(() => 0)) > 0) {
        return locator;
      }
    }

    try {
      const matched = await Promise.any(
        selectors.map(async (selector) => {
          const locator = root.locator(selector).first();
          await locator.waitFor({ state: "attached", timeout: timeoutMs });
          return locator;
        }),
      );

      if ((await matched.count().catch(() => 0)) > 0) {
        return matched;
      }
    } catch {
      // all selectors timed out
    }

    return null;
  }

  private logEditorInputPhase(
    phase: "setTitle" | "setContent" | "validateContent",
    detail: {
      attempt?: number;
      durationMs: number;
      input?: string;
      actual?: string;
      verify?: boolean;
      message?: string;
    },
  ): void {
    const parts = [
      `[${phase}]`,
      detail.attempt !== undefined ? `attempt=${detail.attempt}` : null,
      `durationMs=${detail.durationMs}`,
      detail.input !== undefined ? `input="${detail.input.slice(0, 160)}"` : null,
      detail.actual !== undefined ? `actual="${detail.actual.slice(0, 160)}"` : null,
      detail.verify !== undefined ? `verify=${detail.verify ? "PASS" : "FAIL"}` : null,
      detail.message ? `message="${detail.message}"` : null,
    ].filter(Boolean);

    console.log(parts.join(" "));
  }

  private async performTitleInput(
    pageId: string,
    page: Page,
    title: string,
  ): Promise<string> {
    logEditorInputTrace(3, "Find Title", "before");

    const root = await this.getEditorRoot(pageId, page);

    await waitForNaverEditorReady(page, 15_000).catch(() => null);

    let titleInput: Locator | null = null;
    let matchedSelector = "none";
    let matchedCount = 0;
    let matchedVisible = false;
    let matchedInnerHtml = "";

    for (const selector of TITLE_SELECTORS) {
      const locator = root.locator(selector).first();
      const count = await locator.count().catch(() => 0);

      if (count === 0) {
        continue;
      }

      titleInput = locator;
      matchedSelector = selector;
      matchedCount = count;
      matchedVisible = await locator.isVisible().catch(() => false);
      matchedInnerHtml = await locator
        .evaluate((element) => element.innerHTML.slice(0, 500))
        .catch(() => "");
      break;
    }

    if (!titleInput) {
      titleInput = await this.findAttachedLocator(root, TITLE_SELECTORS, 15_000);

      if (titleInput) {
        for (const selector of TITLE_SELECTORS) {
          const locator = root.locator(selector).first();
          const count = await locator.count().catch(() => 0);

          if (count === 0) {
            continue;
          }

          titleInput = locator;
          matchedSelector = selector;
          matchedCount = count;
          matchedVisible = await locator.isVisible().catch(() => false);
          matchedInnerHtml = await locator
            .evaluate((element) => element.innerHTML.slice(0, 500))
            .catch(() => "");
          break;
        }
      }
    }

    logEditorInputTrace(3, "Find Title", "after", {
      selector: matchedSelector,
      count: matchedCount,
      isVisible: matchedVisible,
      "innerHTML(first)": matchedInnerHtml,
    });

    if (!titleInput || matchedCount === 0) {
      throw new NaverEditorAccessError("제목 입력 영역을 찾을 수 없습니다.");
    }

    await titleInput.click();
    await titleInput.focus();
    logEditorInputTrace(4, "Click Title", "after");

    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText(title);
    await page.waitForTimeout(300);
    logEditorInputTrace(5, "Keyboard.insertText", "after");

    const actualRaw = await this.readTitleDirect(pageId, page);
    console.log(`[6] Read Title - actual text=${actualRaw}`);

    return actualRaw;
  }

  private async performContentInput(
    pageId: string,
    page: Page,
    plainText: string,
  ): Promise<string> {
    const contentSelector = BODY_SELECTORS[0];

    console.log("[1] Find Content - before");

    const root = await this.getEditorRoot(pageId, page);
    let contentInput: Locator | null = null;
    let matchedCount = 0;
    let matchedVisible = false;

    const locator = root.locator(contentSelector).first();
    matchedCount = await locator.count().catch(() => 0);

    if (matchedCount > 0) {
      contentInput = locator;
      matchedVisible = await locator.isVisible().catch(() => false);
    } else {
      contentInput = await this.findAttachedLocator(root, BODY_SELECTORS, 15_000);

      if (contentInput) {
        matchedCount = await contentInput.count().catch(() => 0);
        matchedVisible = await contentInput.isVisible().catch(() => false);
      }
    }

    console.log("[1] Find Content - after");
    console.log(`selector=${contentSelector}`);
    console.log(`count=${matchedCount}`);
    console.log(`isVisible=${matchedVisible}`);

    if (!contentInput || matchedCount === 0) {
      throw new NaverEditorAccessError("본문 입력 영역을 찾을 수 없습니다.");
    }

    await contentInput.click();
    await contentInput.focus();
    console.log("[2] Click Content - after");

    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText(plainText);
    await page.waitForTimeout(400);
    console.log("[3] Keyboard.insertText - after");

    const actualRaw = await this.readContentDirect(pageId, page);
    const normalized = normalizeEditorText(actualRaw);

    console.log("[4] Read Content - after");
    console.log(`length=${normalized.length}`);
    console.log(`preview=${normalized.slice(0, 100)}`);

    return actualRaw;
  }

  private async insertTextIntoParagraph(
    page: Page,
    paragraph: Locator,
    text: string,
  ): Promise<void> {
    await paragraph.click();
    await paragraph.focus();
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.insertText(text);
    await page.waitForTimeout(300);
  }

  private async isWriteEditorFrame(page: Page): Promise<boolean> {
    return (await this.resolveEditorFrame(page)) !== null;
  }

  private async ensureWriteEditorFrame(page: Page): Promise<void> {
    if (await this.isWriteEditorFrame(page)) {
      return;
    }

    const writeUrl = buildNaverEditorWriteUrlCandidates().find((url) =>
      url.includes("PostWriteForm.naver"),
    );

    if (!writeUrl) {
      return;
    }

    await page.goto(writeUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => null);
    await dismissNaverEditorPopups(page);

    const editorFrame = await this.resolveEditorFrame(page);

    if (editorFrame) {
      const rootLocator = editorFrame.locator(
        ".se-documentTitle, .se-title-text, button.save_btn__bzc5B",
      );
      const attachedCount = await rootLocator.count().catch(() => 0);

      if (attachedCount === 0) {
        await rootLocator
          .first()
          .waitFor({ state: "attached", timeout: 10_000 })
          .catch(() => null);
      }
    }
  }

  private async clickTempSaveButton(page: Page): Promise<void> {
    await this.ensureWriteEditorFrame(page);

    const selectors = "button[data-click-area='tpb.save'], button.save_btn__bzc5B";
    const pageButton = page.locator(selectors).first();
    const editorFrame = await this.resolveEditorFrame(page);

    if (await pageButton.isVisible().catch(() => false)) {
      await pageButton.click();
      await page.waitForTimeout(1_500);
      return;
    }

    if (editorFrame) {
      const frameButton = editorFrame.locator(selectors).first();

      if (await frameButton.isVisible().catch(() => false)) {
        await frameButton.click();
        await page.waitForTimeout(1_500);
      }
    }
  }

  private async readTitleDirect(pageId: string, page: Page): Promise<string> {
    const root = await this.getEditorRoot(pageId, page);

    for (const selector of TITLE_SELECTORS) {
      const locator = root.locator(selector).first();

      if ((await locator.count().catch(() => 0)) === 0) {
        continue;
      }

      return (await locator.innerText().catch(() => "")).trim();
    }

    return "";
  }

  private async readContentDirect(pageId: string, page: Page): Promise<string> {
    const root = await this.getEditorRoot(pageId, page);
    const paragraphs = root.locator(".se-component.se-text .se-text-paragraph");
    const count = await paragraphs.count();
    const parts: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const text = (await paragraphs.nth(index).innerText().catch(() => "")).trim();

      if (text) {
        parts.push(text);
      }
    }

    return parts.join("\n");
  }

  private findPageIdForPage(page: Page): string {
    for (const [id, cachedPage] of this.pageRefs.entries()) {
      if (cachedPage === page) {
        return id;
      }
    }

    return this.syncCacheId(page);
  }

  private async saveEditorDebug(page: Page, step: string, error?: unknown): Promise<void> {
    await mkdir(DEBUG_DIR, { recursive: true });
    const pageId = this.findPageIdForPage(page);

    const diagnosis = await playwrightDebugSession.saveArtifacts(
      page,
      step,
      error instanceof Error ? error : error ? new Error(String(error)) : undefined,
    );

    if (diagnosis) {
      console.error(formatFailureDiagnosis(diagnosis));
    }

    const usesIframe = Boolean(editorSession.get(pageId).mainFrame);

    await writeFile(
      path.join(DEBUG_DIR, "current-url.txt"),
      [
        `step=${step}`,
        `url=${page.url()}`,
        `iframe=${usesIframe}`,
        `title=${await this.readTitleDirect(pageId, page).catch(() => "")}`,
        `contentLength=${(await this.readContentDirect(pageId, page).catch(() => "")).length}`,
        `error=${error instanceof Error ? error.message : error ? String(error) : "none"}`,
      ].join("\n"),
      "utf8",
    );
  }
}

export const editorManager = new EditorManager();
