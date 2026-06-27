import type { FrameLocator, Locator, Page } from "playwright";
import { editorRoot } from "../editor/naver-editor.helper";
import { withRetry } from "../playwright/playwright-resilience";
import {
  getSelectorList,
  type NaverSelectorKey,
} from "./naver-selector.registry";

export interface FindSelectorOptions {
  timeoutMs?: number;
  attempts?: number;
  iframeFirst?: boolean;
  pageFallback?: boolean;
}

export interface FoundSelector {
  locator: Locator;
  selector: string;
  key: NaverSelectorKey;
  context: "iframe" | "page";
}

async function findInRoot(
  root: Page | FrameLocator,
  key: NaverSelectorKey,
  timeoutMs: number,
): Promise<FoundSelector | null> {
  for (const selector of getSelectorList(key)) {
    const locator = root.locator(selector).first();

    try {
      await locator.waitFor({ state: "visible", timeout: timeoutMs });
      return { locator, selector, key, context: "iframe" };
    } catch {
      // try next selector
    }
  }

  return null;
}

export async function findNaverSelector(
  page: Page,
  key: NaverSelectorKey,
  options: FindSelectorOptions = {},
): Promise<FoundSelector> {
  const timeoutMs = options.timeoutMs ?? 5_000;
  const attempts = options.attempts ?? 3;
  const iframeFirst = options.iframeFirst ?? true;
  const pageFallback = options.pageFallback ?? true;

  return withRetry(
    async () => {
      if (iframeFirst) {
        const root = await editorRoot(page);
        const inFrame = await findInRoot(root, key, timeoutMs);

        if (inFrame) {
          return inFrame;
        }
      }

      if (pageFallback) {
        const onPage = await findInRoot(page, key, timeoutMs);

        if (onPage) {
          return { ...onPage, context: "page" };
        }
      }

      throw new Error(`${key} 셀렉터를 찾을 수 없습니다.`);
    },
    { attempts, delayMs: 400, label: `findNaverSelector:${key}` },
  );
}

export async function findNaverSelectorOptional(
  page: Page,
  key: NaverSelectorKey,
  options: FindSelectorOptions = {},
): Promise<FoundSelector | null> {
  try {
    return await findNaverSelector(page, key, options);
  } catch {
    return null;
  }
}
