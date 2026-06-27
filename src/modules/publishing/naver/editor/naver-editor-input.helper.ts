import type { Page } from "playwright";
import { wrapNaverBrowserError } from "../login/naver-login.errors";
import { withRetry } from "../playwright/playwright-resilience";
import { findNaverSelector, findNaverSelectorOptional } from "../selectors/naver-selector.resolver";
import { getSelectorList } from "../selectors/naver-selector.registry";
import { editorRoot } from "./naver-editor.helper";

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export async function inputNaverEditorTitle(page: Page, title: string): Promise<void> {
  await withRetry(
    async () => {
      const found = await findNaverSelector(page, "title");
      await found.locator.click();
      await found.locator.focus();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.insertText(title);
      await page.waitForTimeout(300);

      const entered = normalizeEditorText(await found.locator.innerText());

      if (!entered.includes(normalizeEditorText(title))) {
        throw new Error(`제목 입력 검증 실패: expected="${title}", actual="${entered}"`);
      }
    },
    { attempts: 3, delayMs: 500, timeoutMs: 30_000, label: "inputNaverEditorTitle" },
  );
}

export async function inputNaverEditorContentHtml(page: Page, html: string): Promise<void> {
  const plainText = htmlToPlainText(html);
  const minLength = Math.max(10, Math.floor(plainText.length * 0.4));

  await withRetry(
    async () => {
      const found = await findNaverSelector(page, "editor");
      await found.locator.click();
      await found.locator.focus();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.insertText(plainText);
      await page.waitForTimeout(500);

      const entered = normalizeEditorText(await found.locator.innerText());

      if (entered.length < minLength) {
        throw new Error(
          `본문 입력 검증 실패: length=${entered.length}, expected>=${minLength}`,
        );
      }
    },
    { attempts: 3, delayMs: 500, timeoutMs: 45_000, label: "inputNaverEditorContentHtml" },
  );
}

export async function inputNaverEditorHashtags(page: Page, hashtags: string[]): Promise<void> {
  if (hashtags.length === 0) {
    return;
  }

  const found = await findNaverSelector(page, "tagInput");

  for (const rawTag of hashtags) {
    const tag = rawTag.replace(/^#/, "").trim();

    if (!tag) {
      continue;
    }

    await withRetry(
      async () => {
        await found.locator.click();
        await found.locator.fill("");
        await found.locator.type(tag, { delay: 30 });
        await page.keyboard.press("Enter");
        await page.waitForTimeout(200);
      },
      { attempts: 2, delayMs: 300, label: "inputNaverEditorHashtags" },
    );
  }
}

export async function readNaverEditorTitle(page: Page): Promise<string> {
  const root = await editorRoot(page);

  for (const selector of getSelectorList("title")) {
    const locator = root.locator(selector).first();
    const visible = await locator.isVisible().catch(() => false);

    if (!visible) {
      continue;
    }

    return (await locator.innerText().catch(() => "")).trim();
  }

  return "";
}

export async function readNaverEditorContent(page: Page): Promise<string> {
  const root = await editorRoot(page);

  for (const selector of getSelectorList("editorRead")) {
    const container = root.locator(selector).first();
    const visible = await container.isVisible().catch(() => false);

    if (!visible) {
      continue;
    }

    return (await container.innerText().catch(() => "")).trim();
  }

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

export async function readNaverEditorHashtags(page: Page): Promise<string[]> {
  const root = await editorRoot(page);
  const tags: string[] = [];

  for (const selector of getSelectorList("tagChip")) {
    const items = root.locator(selector);
    const count = await items.count();

    for (let index = 0; index < count; index += 1) {
      const text = (await items.nth(index).innerText().catch(() => "")).trim();

      if (text) {
        tags.push(text.replace(/^#/, ""));
      }
    }

    if (tags.length > 0) {
      return tags;
    }
  }

  const tagInput = await findNaverSelectorOptional(page, "tagInput");

  if (!tagInput) {
    return tags;
  }

  const value = await tagInput.locator.inputValue().catch(() => "");

  if (value.trim()) {
    tags.push(...value.split(/[,\s#]+/).filter(Boolean));
  }

  return tags;
}

export function normalizeEditorText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function safeEditorInput<T>(
  action: () => Promise<T>,
): Promise<{ success: true; value: T } | { success: false; message: string }> {
  try {
    const value = await action();
    return { success: true, value };
  } catch (error) {
    const wrapped = wrapNaverBrowserError(error);
    return { success: false, message: wrapped.message };
  }
}
