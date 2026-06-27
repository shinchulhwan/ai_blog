export { NaverPublisher } from "./naver.publisher";

export {
  createNaverAdapter,
  getAvailableNaverAdapters,
  getPlannedNaverAdapters,
  resolveNaverAdapterType,
} from "./adapters/naver-adapter.factory";

export type { NaverPublishAdapter } from "./adapters/naver-adapter.types";
export { MockNaverAdapter } from "./adapters/mock.naver-adapter";
export { OpenApiNaverAdapter } from "./adapters/open-api.naver-adapter";
export { PlaywrightNaverAdapter } from "./adapters/playwright.naver-adapter";
export { BrowserAutomationNaverAdapter } from "./adapters/browser-automation.naver-adapter";
export { convertPublishContentToNaverHtml } from "./converters/naver-html.converter";

export {
  BrowserManager,
  browserManager,
  SessionManager,
  sessionManager,
  CookieManager,
  cookieManager,
  LoginManager,
  loginManager,
  EditorManager,
  editorManager,
  PublishManager,
  publishManager,
  NaverAutomationEngine,
  naverAutomationEngine,
  NaverAccountRegistry,
  naverAccountRegistry,
  NaverPublishingPreparationService,
  naverPublishingPreparationService,
  resolveNaverBrowserMode,
} from "./automation";

export type {
  BrowserInstance,
  BrowserLaunchOptions,
  BrowserPageHandle,
  NaverSession,
  NaverSessionStatus,
  NaverCookie,
  NaverCookieStore,
  LoginOptions,
  NaverAccountRecord,
  RegisterNaverAccountInput,
  NaverAutomationEngineDeps,
  EditorStepDefinition,
  EditorStepId,
  EditorPrepareResult,
  NaverPublishPreparationRecord,
  NaverManager,
  NaverManagerContext,
  NaverPublishingPreparationResult,
} from "./automation";

export type {
  NaverAdapterType,
  NaverCredentials,
  NaverLoginResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
  NaverPublishStatusValue,
  NaverAdapterPublishResult,
} from "./types/naver.types";
