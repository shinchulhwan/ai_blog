import { NotImplementedError } from "@/lib/errors";
import type { NaverAdapterType } from "../types/naver.types";
import type { NaverPublishAdapter } from "./naver-adapter.types";
import { BrowserAutomationNaverAdapter } from "./browser-automation.naver-adapter";
import { MockNaverAdapter } from "./mock.naver-adapter";
import { OpenApiNaverAdapter } from "./open-api.naver-adapter";
import { PlaywrightNaverAdapter } from "./playwright.naver-adapter";

export function createNaverAdapter(
  adapterType: NaverAdapterType = resolveNaverAdapterType(),
): NaverPublishAdapter {
  switch (adapterType) {
    case "mock":
      return new MockNaverAdapter();
    case "open_api":
      return new OpenApiNaverAdapter();
    case "playwright":
      return new PlaywrightNaverAdapter();
    case "browser_automation":
      return new BrowserAutomationNaverAdapter();
    default:
      throw new NotImplementedError(`Naver adapter: ${String(adapterType)}`);
  }
}

export function resolveNaverAdapterType(): NaverAdapterType {
  const value = process.env.NAVER_PUBLISH_ADAPTER?.trim().toLowerCase();

  if (
    value === "open_api" ||
    value === "playwright" ||
    value === "browser_automation"
  ) {
    return value;
  }

  if (value === "mock" && process.env.NAVER_ALLOW_MOCK === "true") {
    return "mock";
  }

  return "browser_automation";
}

export function getAvailableNaverAdapters(): NaverAdapterType[] {
  return ["browser_automation", "playwright"];
}

export function getPlannedNaverAdapters(): NaverAdapterType[] {
  return ["mock", "open_api", "playwright", "browser_automation"];
}
