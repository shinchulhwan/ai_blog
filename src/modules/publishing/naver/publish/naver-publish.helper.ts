import type { Frame, Locator, Page } from "playwright";
import { normalizeEditorText } from "../editor/naver-editor-input.helper";
import { EDITOR_FRAME_URL_PATTERN } from "../editor/editor-session";
import { dismissNaverEditorPopups } from "../editor/naver-editor.helper";
import { wrapNaverBrowserError } from "../login/naver-login.errors";
import { playwrightDebugSession } from "../playwright/playwright-debug";
import { getSelectorList } from "../selectors/naver-selector.registry";
import { NaverPublishFailedError, NaverPublishTimeoutError } from "./naver-publish.errors";

const SUCCESS_URL_PATTERN =
  /PostView\.naver|blog\.naver\.com\/[^/?#]+\/\d+|logNo=\d+/i;

const DRAFT_SAVE_MAX_ATTEMPTS = 3;
const PUBLISH_MAX_ATTEMPTS = 2;

const PUBLISH_BUTTON_SELECTORS = getSelectorList("publishButton");
const CONFIRM_PUBLISH_SELECTORS = getSelectorList("confirmPublishButton");

const DRAFT_SAVE_SELECTORS = [
  "button[data-click-area='tpb.save']",
  "button.save_btn__bzc5B",
  ...getSelectorList("tempSaveButton"),
];

export function isNaverPublishedUrl(url: string): boolean {
  return SUCCESS_URL_PATTERN.test(url);
}

export function extractNaverPostId(url: string): string | null {
  const logNoMatch = url.match(/logNo=(\d+)/i);
  if (logNoMatch?.[1]) {
    return logNoMatch[1];
  }

  const pathMatch = url.match(/blog\.naver\.com\/[^/?#]+\/(\d+)/i);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  return null;
}

function resolveEditorFrame(page: Page): Frame | null {
  for (const frame of page.frames()) {
    if (EDITOR_FRAME_URL_PATTERN.test(frame.url())) {
      return frame;
    }
  }

  return null;
}

async function findDraftSaveButton(page: Page): Promise<{
  locator: Locator;
  selector: string;
  count: number;
  isVisible: boolean;
} | null> {
  const editorFrame = resolveEditorFrame(page);
  const searchRoots: Array<Page | Frame> = [];

  if (editorFrame) {
    searchRoots.push(editorFrame);
  }

  searchRoots.push(page);

  for (const root of searchRoots) {
    for (const selector of DRAFT_SAVE_SELECTORS) {
      const locator = root.locator(selector).first();
      const count = await locator.count().catch(() => 0);

      if (count === 0) {
        continue;
      }

      const isVisible = await locator.isVisible().catch(() => false);

      return { locator, selector, count, isVisible };
    }
  }

  return null;
}

async function verifyDraftSaved(page: Page): Promise<{ verified: boolean; reason: string }> {
  const editorFrame = resolveEditorFrame(page);
  const searchRoots: Array<Page | Frame> = [];

  if (editorFrame) {
    searchRoots.push(editorFrame);
  }

  searchRoots.push(page);

  const toastSelectors = [
    "[role='alert']",
    "[class*='toast']",
    "[class*='Toast']",
    ".se-popup-alert",
  ];

  for (const root of searchRoots) {
    for (const selector of toastSelectors) {
      const locator = root.locator(selector);
      const count = await locator.count().catch(() => 0);

      if (count === 0) {
        continue;
      }

      const text = (await locator.first().innerText().catch(() => "")).trim();

      if (/저장|완료/.test(text)) {
        return { verified: true, reason: `message=${text}` };
      }
    }
  }

  for (const root of searchRoots) {
    const countBtn = root
      .locator("button.save_count_btn__ZTLNa, button[data-click-area*='tpb*s.count']")
      .first();
    const count = await countBtn.count().catch(() => 0);

    if (count === 0) {
      continue;
    }

    const ariaLabel = await countBtn.getAttribute("aria-label").catch(() => "");

    if (/임시저장/.test(ariaLabel ?? "")) {
      return { verified: true, reason: `draftList=${ariaLabel}` };
    }
  }

  for (const root of searchRoots) {
    const autosave = root.locator(".autosave_message__PgBf8, [class*='autosave_message']").first();
    const count = await autosave.count().catch(() => 0);

    if (count === 0) {
      continue;
    }

    const text = (await autosave.innerText().catch(() => "")).trim();

    if (/자동저장|저장/.test(text)) {
      return { verified: true, reason: `autosave=${text}` };
    }
  }

  if (editorFrame && EDITOR_FRAME_URL_PATTERN.test(editorFrame.url())) {
    const frameUrl = editorFrame.url();

    if (!/PostList/i.test(frameUrl)) {
      return { verified: true, reason: `editorFrame=${frameUrl}` };
    }

    return {
      verified: false,
      reason: `임시저장 후 PostList로 전환됨: ${frameUrl}`,
    };
  }

  return {
    verified: false,
    reason: "임시저장 완료 메시지/UI 확인 실패",
  };
}

async function performDraftSaveAttempt(page: Page): Promise<{
  success: boolean;
  message: string;
}> {
  await dismissNaverEditorPopups(page);

  console.log("[1] Find Draft Button - before");

  const draftButton = await findDraftSaveButton(page);
  const loggedSelector = draftButton?.selector ?? DRAFT_SAVE_SELECTORS[0];
  const loggedCount = draftButton?.count ?? 0;
  const loggedVisible = draftButton?.isVisible ?? false;

  console.log("[1] Find Draft Button - after");
  console.log(`selector=${loggedSelector}`);
  console.log(`count=${loggedCount}`);
  console.log(`isVisible=${loggedVisible}`);

  if (!draftButton || loggedCount === 0) {
    const frameUrl = resolveEditorFrame(page)?.url() ?? page.url();

    return {
      success: false,
      message: `임시저장 버튼 없음 (iframe=${frameUrl})`,
    };
  }

  if (!loggedVisible) {
    await draftButton.locator.waitFor({ state: "attached", timeout: 5_000 }).catch(() => null);
  }

  await draftButton.locator.click();
  await page.waitForTimeout(2_000);
  console.log("[2] Click Draft - after");

  const verification = await verifyDraftSaved(page);

  console.log("[3] Verify Draft Saved - after");
  console.log(`verified=${verification.verified}`);
  console.log(`reason=${verification.reason}`);

  if (!verification.verified) {
    return {
      success: false,
      message: verification.reason,
    };
  }

  return {
    success: true,
    message: verification.reason,
  };
}

export async function tryNaverTempSave(page: Page): Promise<{
  attempted: boolean;
  success: boolean;
  message: string;
}> {
  let lastMessage = "임시저장 실패";

  for (let attempt = 1; attempt <= DRAFT_SAVE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await performDraftSaveAttempt(page);

      if (result.success) {
        return {
          attempted: true,
          success: true,
          message: result.message,
        };
      }

      lastMessage = result.message;

      if (attempt < DRAFT_SAVE_MAX_ATTEMPTS) {
        await page.waitForTimeout(500 * attempt);
      }
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);
      lastMessage = wrapped.message;

      console.log("[3] Verify Draft Saved - after");
      console.log("verified=false");
      console.log(`reason=${lastMessage}`);

      if (attempt >= DRAFT_SAVE_MAX_ATTEMPTS) {
        return {
          attempted: true,
          success: false,
          message: lastMessage,
        };
      }

      await page.waitForTimeout(500 * attempt);
    }
  }

  return {
    attempted: true,
    success: false,
    message: lastMessage,
  };
}

async function findPublishButton(page: Page): Promise<{
  locator: Locator;
  selector: string;
  count: number;
  isVisible: boolean;
} | null> {
  const editorFrame = resolveEditorFrame(page);
  const searchRoots: Array<Page | Frame> = [];

  if (editorFrame) {
    searchRoots.push(editorFrame);
  }

  searchRoots.push(page);

  for (const root of searchRoots) {
    for (const selector of PUBLISH_BUTTON_SELECTORS) {
      const locator = root.locator(selector).first();
      const count = await locator.count().catch(() => 0);

      if (count === 0) {
        continue;
      }

      const isVisible = await locator.isVisible().catch(() => false);

      return { locator, selector, count, isVisible };
    }
  }

  return null;
}

async function findConfirmPublishButton(
  page: Page,
): Promise<{ locator: Locator; selector: string } | null> {
  const editorFrame = resolveEditorFrame(page);
  const searchRoots: Array<Page | Frame> = [];

  if (editorFrame) {
    searchRoots.push(editorFrame);
  }

  searchRoots.push(page);

  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    for (const root of searchRoots) {
      for (const selector of CONFIRM_PUBLISH_SELECTORS) {
        const locator = root.locator(selector).first();
        const count = await locator.count().catch(() => 0);

        if (count === 0) {
          continue;
        }

        const isVisible = await locator.isVisible().catch(() => false);

        if (isVisible || count > 0) {
          return { locator, selector };
        }
      }
    }

    await page.waitForTimeout(300);
  }

  return null;
}

async function logPublishFailure(page: Page, step: string, error: unknown): Promise<void> {
  const documentTitle = await page.title().catch(() => "");

  console.log(`failureStep=${step}`);
  console.log(`currentUrl=${page.url()}`);
  console.log(`document.title=${documentTitle}`);

  await playwrightDebugSession.saveArtifacts(
    page,
    step,
    error instanceof Error ? error : new Error(String(error)),
    { finalizeTrace: true },
  );
}

async function verifyPublishedPost(
  page: Page,
  publishedUrl: string,
  expectedTitle: string,
): Promise<{
  verified: boolean;
  httpStatus: number | null;
  pageTitle: string;
  reason: string;
}> {
  const normalizedExpected = normalizeEditorText(expectedTitle);
  const documentTitle = (await page.title().catch(() => "")).trim();
  const normalizedDocumentTitle = normalizeEditorText(documentTitle);
  const titlePrefix = normalizedExpected.slice(0, Math.min(20, normalizedExpected.length));

  if (
    isNaverPublishedUrl(publishedUrl) &&
    (normalizedDocumentTitle.includes(titlePrefix) || documentTitle.includes(expectedTitle.slice(0, 20)))
  ) {
    return {
      verified: true,
      httpStatus: 200,
      pageTitle: documentTitle,
      reason: "document.title matched",
    };
  }

  try {
    const response = await page.request.get(publishedUrl, { timeout: 30_000 });
    const httpStatus = response.status();
    const html = await response.text();
    const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i)?.[1] ?? "";
    const titleTag = html.match(/<title[^>]*>([^<]+)/i)?.[1] ?? "";
    const pageTitle = (ogTitle || titleTag || documentTitle).trim();
    const normalizedActual = normalizeEditorText(pageTitle);
    const verified =
      httpStatus >= 200 &&
      httpStatus < 400 &&
      (normalizedActual.includes(titlePrefix) ||
        html.includes(expectedTitle) ||
        normalizedDocumentTitle.includes(titlePrefix));

    return {
      verified,
      httpStatus,
      pageTitle: pageTitle || documentTitle,
      reason: verified
        ? "published url/title matched"
        : `title mismatch: expected="${expectedTitle}", actual="${pageTitle || documentTitle}"`,
    };
  } catch (error) {
    const fallbackVerified =
      isNaverPublishedUrl(publishedUrl) && normalizedDocumentTitle.includes(titlePrefix);

    return {
      verified: fallbackVerified,
      httpStatus: null,
      pageTitle: documentTitle,
      reason: fallbackVerified
        ? "document.title matched (request fallback)"
        : error instanceof Error
          ? error.message
          : String(error),
    };
  }
}

async function performNaverPublishAttempt(
  page: Page,
  expectedTitle?: string,
): Promise<string> {
  await dismissNaverEditorPopups(page);

  console.log("[1] Find Publish Button - before");

  const publishButton = await findPublishButton(page);
  const loggedSelector = publishButton?.selector ?? PUBLISH_BUTTON_SELECTORS[0];
  const loggedCount = publishButton?.count ?? 0;
  const loggedVisible = publishButton?.isVisible ?? false;

  console.log("[1] Find Publish Button - after");
  console.log(`selector=${loggedSelector}`);
  console.log(`count=${loggedCount}`);
  console.log(`isVisible=${loggedVisible}`);

  if (!publishButton || loggedCount === 0) {
    throw new NaverPublishFailedError("발행 버튼을 찾을 수 없습니다.");
  }

  if (!loggedVisible) {
    await publishButton.locator.waitFor({ state: "attached", timeout: 5_000 }).catch(() => null);
  }

  await publishButton.locator.click();
  await page.waitForTimeout(800);
  console.log("[2] Click Publish - after");

  const confirmButton = await findConfirmPublishButton(page);
  const popupExists = confirmButton !== null;

  console.log("[3] Confirm Publish - after");
  console.log(`popupExists=${popupExists}`);

  if (confirmButton) {
    await confirmButton.locator.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => null);
    console.log(`confirmResult=clicked selector=${confirmButton.selector}`);
  } else {
    console.log("confirmResult=skipped");
  }

  const publishedUrl = await waitForNaverPublishComplete(page, 60_000);

  console.log("[4] Wait Navigation - after");
  console.log(`finalUrl=${publishedUrl}`);

  let verification = {
    verified: true,
    httpStatus: null as number | null,
    pageTitle: "",
    reason: "title check skipped",
  };

  if (expectedTitle?.trim()) {
    verification = await verifyPublishedPost(page, publishedUrl, expectedTitle);
  }

  console.log("[5] Verify Published - after");
  console.log(`publishedUrl=${publishedUrl}`);
  console.log(`pageTitle=${verification.pageTitle}`);
  console.log(`httpStatus=${verification.httpStatus ?? "n/a"}`);
  console.log(`verified=${verification.verified}`);

  if (!verification.verified) {
    console.log(`verifyReason=${verification.reason}`);
    throw new NaverPublishFailedError(verification.reason);
  }

  return publishedUrl;
}

export async function openNaverPublishPanel(page: Page): Promise<void> {
  const publishButton = await findPublishButton(page);

  if (!publishButton) {
    throw new NaverPublishFailedError("발행 버튼을 찾을 수 없습니다.");
  }

  await publishButton.locator.click();
  await page.waitForTimeout(800);
}

export async function confirmNaverPublish(page: Page): Promise<void> {
  const confirmButton = await findConfirmPublishButton(page);

  if (!confirmButton) {
    return;
  }

  await Promise.all([
    page
      .waitForURL((url) => isNaverPublishedUrl(url.href), { timeout: 60_000 })
      .catch(() => null),
    confirmButton.locator.click(),
  ]);

  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => null);
}

export async function waitForNaverPublishComplete(
  page: Page,
  timeoutMs = 60_000,
): Promise<string> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const url = page.url();

    if (isNaverPublishedUrl(url)) {
      return url;
    }

    const link = page.locator("a[href*='PostView.naver'], a[href*='logNo=']").first();
    const href = await link.getAttribute("href").catch(() => null);

    if (href && isNaverPublishedUrl(href)) {
      return href.startsWith("http") ? href : `https://blog.naver.com${href}`;
    }

    await page.waitForTimeout(500);
  }

  throw new NaverPublishTimeoutError();
}

export async function performNaverPublish(
  page: Page,
  expectedTitle?: string,
): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= PUBLISH_MAX_ATTEMPTS; attempt += 1) {
    try {
      const currentUrl = page.url();

      if (isNaverPublishedUrl(currentUrl) && expectedTitle?.trim()) {
        const verification = await verifyPublishedPost(page, currentUrl, expectedTitle);

        console.log("[5] Verify Published - after");
        console.log(`publishedUrl=${currentUrl}`);
        console.log(`pageTitle=${verification.pageTitle}`);
        console.log(`httpStatus=${verification.httpStatus ?? "n/a"}`);
        console.log(`verified=${verification.verified}`);

        if (verification.verified) {
          return currentUrl;
        }

        throw new NaverPublishFailedError(verification.reason);
      }

      return await performNaverPublishAttempt(page, expectedTitle);
    } catch (error) {
      lastError = error;

      if (isNaverPublishedUrl(page.url()) && expectedTitle?.trim()) {
        const verification = await verifyPublishedPost(page, page.url(), expectedTitle);

        if (verification.verified) {
          console.log("[5] Verify Published - after");
          console.log(`publishedUrl=${page.url()}`);
          console.log(`pageTitle=${verification.pageTitle}`);
          console.log(`httpStatus=${verification.httpStatus ?? "n/a"}`);
          console.log(`verified=true`);
          return page.url();
        }
      }

      await logPublishFailure(page, `publish-attempt-${attempt}`, error);

      if (attempt >= PUBLISH_MAX_ATTEMPTS) {
        break;
      }

      if (isNaverPublishedUrl(page.url())) {
        break;
      }

      await page.waitForTimeout(1_000);
    }
  }

  throw wrapNaverBrowserError(lastError);
}
