import type { FrameLocator, Page } from "playwright";
import { wrapNaverBrowserError } from "../login/naver-login.errors";

import {
  buildNaverEditorWriteUrlCandidates,
  NAVER_EDITOR_WRITE_URL_PATTERN,
  getPrimaryEditorWriteUrl,
} from "./naver-editor.config";
import { getSelectorList } from "../selectors/naver-selector.registry";

export const NAVER_BLOG_WRITE_URL = getPrimaryEditorWriteUrl();

const TITLE_SELECTORS = getSelectorList("title");
const CONTENT_SELECTORS = getSelectorList("editorRead");
const EDITOR_ROOT_SELECTORS = getSelectorList("editorRoot");
const POPUP_DISMISS_SELECTORS = getSelectorList("popupDismiss");

const BLOG_HOME_WRITE_BUTTON_SELECTORS = [
  "a[alt='글쓰기']",
  "a.item[href*='GoBlogWrite']",
  "a[href*='GoBlogWrite.naver']",
  "a[href*='PostWriteForm.naver']",
  "a:has-text('글쓰기')",
  "button:has-text('글쓰기')",
] as const;

export interface EditorDetectionResult {
  found: boolean;
  reason: string | null;
  context: "mainFrame" | "page";
}

export interface EditorDiagnostics {
  currentUrl: string;
  finalUrl: string;
  usesIframe: boolean;
  titleSelector: string | null;
  contentSelector: string | null;
  errorPage: boolean;
}

async function resolveEditorRoot(page: Page): Promise<Page | FrameLocator> {
  const frameCount = await page.locator("#mainFrame").count();
  return frameCount > 0 ? page.frameLocator("#mainFrame") : page;
}

async function hasVisibleSelector(
  root: Page | FrameLocator,
  selectors: readonly string[],
): Promise<boolean> {
  return (await findFirstVisibleSelector(root, selectors)) !== null;
}

async function findFirstVisibleSelector(
  root: Page | FrameLocator,
  selectors: readonly string[],
): Promise<string | null> {
  for (const selector of selectors) {
    const visible = await root
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false);

    if (visible) {
      return selector;
    }
  }

  return null;
}

export async function isNaverEditorErrorPage(page: Page): Promise<boolean> {
  const bodyText = await page.locator("body").innerText().catch(() => "");
  return (
    bodyText.includes("유효하지 않은 요청") ||
    bodyText.includes("블로그 아이디가 없습니다") ||
    (await page.locator(".error_wrap").count()) > 0
  );
}

export function isNaverLoginRedirect(url: string): boolean {
  return url.includes("nidlogin.login") || url.includes("nid.naver.com/nidlogin");
}

export function isNaverEditorUrl(url: string): boolean {
  return NAVER_EDITOR_WRITE_URL_PATTERN.test(url);
}

export function isNaverBlogHomeUrl(url: string): boolean {
  return /section\.blog\.naver\.com\/BlogHome/i.test(url);
}

export async function logEditorNavigationState(page: Page): Promise<void> {
  const mainFrame = page.frame({ name: "mainFrame" });
  const iframeUrl = mainFrame?.url() ?? "none";
  const documentTitle = await page.title().catch(() => "unknown");
  const root = await resolveEditorRoot(page);
  const editorRoot =
    (await findFirstVisibleSelector(root, EDITOR_ROOT_SELECTORS)) ?? "none";

  console.log(`Editor Navigation — url=${page.url()}`);
  console.log(`Editor Navigation — iframe=${iframeUrl}`);
  console.log(`Editor Navigation — editorRoot=${editorRoot}`);
  console.log(`Editor Navigation — document.title=${documentTitle}`);
}

async function clickBlogHomeWriteButton(page: Page): Promise<Page | null> {
  for (const selector of BLOG_HOME_WRITE_BUTTON_SELECTORS) {
    const button = page.locator(selector).first();
    const visible = await button.isVisible().catch(() => false);

    if (!visible) {
      continue;
    }

    const href = await button.getAttribute("href").catch(() => null);
    const target = await button.getAttribute("target").catch(() => null);
    const context = page.context();
    const popupPromise = context
      .waitForEvent("page", { timeout: 20_000 })
      .catch(() => null);

    await button.click();

    const popup = await popupPromise;

    if (popup) {
      await popup.waitForLoadState("domcontentloaded", { timeout: 45_000 }).catch(() => null);
      await popup.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);
      return popup;
    }

    if (href) {
      const absoluteHref = href.startsWith("http")
        ? href
        : new URL(href, page.url()).href;

      if (target !== "_blank") {
        await page.goto(absoluteHref, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
      } else {
        await page.goto(absoluteHref, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
      }

      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);
      return page;
    }

    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);
    return page;
  }

  return null;
}

async function waitForEditorNavigationComplete(
  page: Page,
  timeoutMs = 45_000,
): Promise<EditorDetectionResult> {
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => null);
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);

  await page
    .waitForURL(NAVER_EDITOR_WRITE_URL_PATTERN, { timeout: 20_000 })
    .catch(() => null);

  const mainFrame = page.frame({ name: "mainFrame" });

  if (mainFrame) {
    await mainFrame
      .waitForURL(/PostWriteForm|GoBlogWrite|postwrite/i, { timeout: 20_000 })
      .catch(() => null);
  }

  return waitForNaverEditorReady(page, timeoutMs);
}

async function navigateByWriteUrlCandidates(page: Page): Promise<Page> {
  for (const targetUrl of buildNaverEditorWriteUrlCandidates()) {
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => null);

    const currentUrl = page.url();

    if (isNaverLoginRedirect(currentUrl)) {
      continue;
    }

    if (await isNaverEditorErrorPage(page)) {
      continue;
    }

    const detection = await detectNaverEditor(page);

    if (detection.found) {
      break;
    }
  }

  return page;
}

async function removePersonalNoticeLayer(page: Page): Promise<void> {
  await page
    .locator("#personalNoticeLayer button.btn_close, #personalNoticeLayer button._btn_close")
    .first()
    .click({ force: true, timeout: 3_000 })
    .catch(() => undefined);

  await page
    .evaluate(() => {
      const layer = document.getElementById("personalNoticeLayer");

      if (layer) {
        layer.style.display = "none";
        layer.remove();
      }

      document.body.style.overflow = "";
    })
    .catch(() => undefined);
}

async function removePersonalNoticeLayerInFrames(page: Page): Promise<void> {
  for (const frame of page.frames()) {
    await frame
      .locator("#personalNoticeLayer button.btn_close, #personalNoticeLayer button._btn_close")
      .first()
      .click({ force: true, timeout: 2_000 })
      .catch(() => undefined);

    await frame
      .evaluate(() => {
        const layer = document.getElementById("personalNoticeLayer");

        if (layer) {
          layer.style.display = "none";
          layer.remove();
        }

        document.body.style.overflow = "";
      })
      .catch(() => undefined);
  }
}

export async function dismissNaverEditorPopups(page: Page): Promise<void> {
  await removePersonalNoticeLayer(page);
  await removePersonalNoticeLayerInFrames(page);

  for (const selector of POPUP_DISMISS_SELECTORS) {
    const button = page.locator(selector).first();
    const visible = await button.isVisible().catch(() => false);

    if (visible) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(300);
    }
  }

  const frameCount = await page.locator("#mainFrame").count();

  if (frameCount > 0) {
    const frame = page.frameLocator("#mainFrame");

    for (const selector of POPUP_DISMISS_SELECTORS) {
      const button = frame.locator(selector).first();
      const visible = await button.isVisible().catch(() => false);

      if (visible) {
        await button.click().catch(() => undefined);
        await page.waitForTimeout(300);
      }
    }
  }
}

export async function detectNaverEditor(page: Page): Promise<EditorDetectionResult> {
  const url = page.url();

  if (isNaverLoginRedirect(url)) {
    return {
      found: false,
      reason: "로그인 페이지로 리다이렉트되었습니다. 세션이 만료되었을 수 있습니다.",
      context: "page",
    };
  }

  if (await isNaverEditorErrorPage(page)) {
    return {
      found: false,
      reason: "블로그 ID 없이 에디터 URL 접근 — 오류 페이지",
      context: "page",
    };
  }

  const frameCount = await page.locator("#mainFrame").count();

  if (frameCount > 0) {
    const frame = page.frameLocator("#mainFrame");
    const hasTitle = await hasVisibleSelector(frame, TITLE_SELECTORS);
    const hasContent = await hasVisibleSelector(frame, CONTENT_SELECTORS);

    if (hasTitle || hasContent) {
      return {
        found: true,
        reason: null,
        context: "mainFrame",
      };
    }
  }

  const hasTitle = await hasVisibleSelector(page, TITLE_SELECTORS);
  const hasContent = await hasVisibleSelector(page, CONTENT_SELECTORS);

  if (hasTitle || hasContent) {
    return {
      found: true,
      reason: null,
      context: "page",
    };
  }

  return {
    found: false,
    reason: "SmartEditor DOM(제목/본문)을 찾을 수 없습니다.",
    context: "page",
  };
}

export async function enterNaverBlogEditor(page: Page): Promise<Page> {
  let activePage = page;
  let detection = await detectNaverEditor(activePage);

  if (detection.found) {
    await dismissNaverEditorPopups(activePage);
    await logEditorNavigationState(activePage);
    return activePage;
  }

  const currentUrl = activePage.url();

  if (isNaverBlogHomeUrl(currentUrl) || /section\.blog\.naver\.com/i.test(currentUrl)) {
    const afterClick = await clickBlogHomeWriteButton(activePage);

    if (afterClick) {
      activePage = afterClick;
    }

    detection = await waitForEditorNavigationComplete(activePage);

    if (detection.found) {
      await dismissNaverEditorPopups(activePage);
      await logEditorNavigationState(activePage);
      return activePage;
    }
  }

  activePage = await navigateByWriteUrlCandidates(activePage);
  await waitForEditorNavigationComplete(activePage);
  await dismissNaverEditorPopups(activePage);
  await logEditorNavigationState(activePage);

  return activePage;
}

export async function navigateToNaverEditor(page: Page): Promise<string> {
  const activePage = await enterNaverBlogEditor(page);
  return activePage.url();
}

export async function inspectNaverEditor(page: Page): Promise<EditorDiagnostics> {
  const frameCount = await page.locator("#mainFrame").count();
  const usesIframe = frameCount > 0;
  const root = usesIframe ? page.frameLocator("#mainFrame") : page;

  const titleSelector = await findFirstVisibleSelector(root, TITLE_SELECTORS);
  const contentSelector = await findFirstVisibleSelector(root, CONTENT_SELECTORS);
  const currentUrl = page.url();

  return {
    currentUrl,
    finalUrl: currentUrl,
    usesIframe,
    titleSelector,
    contentSelector,
    errorPage: await isNaverEditorErrorPage(page),
  };
}

export async function waitForNaverEditorReady(
  page: Page,
  timeoutMs = 45_000,
): Promise<EditorDetectionResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await dismissNaverEditorPopups(page);
      const detection = await detectNaverEditor(page);

      if (detection.found) {
        return detection;
      }

      if (isNaverLoginRedirect(page.url())) {
        return detection;
      }
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);

      return {
        found: false,
        reason: wrapped.message,
        context: "page",
      };
    }

    await page.waitForTimeout(500);
  }

  const lastCheck = await detectNaverEditor(page);

  return {
    found: false,
    reason: lastCheck.reason ?? "에디터 로딩 시간이 초과되었습니다.",
    context: lastCheck.context,
  };
}

// Keep editorRoot exported for future editor input steps.
export { resolveEditorRoot as editorRoot };
