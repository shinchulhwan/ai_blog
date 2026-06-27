import { randomUUID } from "crypto";
import type { BrowserInstance, BrowserPageHandle } from "./browser.types";

export interface MockBrowserPage {
  id: string;
  url: string;
}

export interface MockBrowserState {
  instance: BrowserInstance;
  pages: Map<string, MockBrowserPage>;
}

export function createMockBrowserState(headless = true): MockBrowserState {
  return {
    instance: {
      id: randomUUID(),
      launchedAt: new Date(),
      headless,
      mock: true,
    },
    pages: new Map(),
  };
}

export function createMockPage(state: MockBrowserState, url = "about:blank"): BrowserPageHandle {
  const page: MockBrowserPage = {
    id: randomUUID(),
    url,
  };

  state.pages.set(page.id, page);

  return {
    id: page.id,
    browserId: state.instance.id,
    url: page.url,
    mock: true,
  };
}

export function navigateMockPage(
  state: MockBrowserState,
  pageId: string,
  url: string,
): BrowserPageHandle {
  const page = state.pages.get(pageId);

  if (!page) {
    throw new Error("Mock browser page를 찾을 수 없습니다.");
  }

  page.url = url;

  return {
    id: page.id,
    browserId: state.instance.id,
    url: page.url,
    mock: true,
  };
}

export function disposeMockBrowserState(state: MockBrowserState | null): void {
  if (!state) {
    return;
  }

  state.pages.clear();
}
