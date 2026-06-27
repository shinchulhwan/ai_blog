import type { NaverPublishAdapter } from "./naver-adapter.types";
import { naverAutomationEngine } from "../automation/naver-automation.engine";
import type {
  NaverAdapterPublishResult,
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";

export class BrowserAutomationNaverAdapter implements NaverPublishAdapter {
  readonly type = "browser_automation" as const;

  constructor(private readonly engine = naverAutomationEngine) {}

  async login(credentials?: NaverCredentials): Promise<NaverLoginResult> {
    return this.engine.ensureLoggedIn({ credentials });
  }

  async publish(payload: NaverPublishPayload): Promise<NaverAdapterPublishResult> {
    return this.engine.publishPost(payload);
  }

  async getPublishStatus(externalId: string): Promise<NaverPublishStatusResult> {
    return this.engine.getPublishStatus(externalId);
  }
}
