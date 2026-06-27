export { BrowserManager, browserManager } from "../browser/browser.manager";
export type {
  BrowserInstance,
  BrowserLaunchOptions,
  BrowserManagerConfig,
  BrowserPageHandle,
  BrowserHealthCheckResult,
} from "../browser/browser.types";

export { SessionManager, sessionManager } from "../session/session.manager";
export type {
  CreateSessionInput,
  NaverSession,
  NaverSessionStatus,
} from "../session/session.types";

export { CookieManager, cookieManager } from "../cookies/cookie.manager";
export type { NaverCookie, NaverCookieStore } from "../cookies/cookie.types";

export { LoginManager, loginManager } from "../login/login.manager";
export type {
  LoginManagerDeps,
  LoginOptions,
  LoginCheckResult,
  CredentialLoginResult,
} from "../login/login.manager";

export {
  NaverLoginError,
  NaverLoginFailedError,
  NaverSessionExpiredError,
  NaverTwoFactorRequiredError,
  NaverBrowserClosedError,
  wrapNaverBrowserError,
} from "../login/naver-login.errors";

export { EditorManager, editorManager } from "../editor/editor.manager";
export type {
  EditorStepDefinition,
  EditorStepHandler,
  EditorStepId,
  EditorPrepareResult,
  EditorOpenResult,
  EditorReadyResult,
  EditorValidateResult,
  EditorAccessResult,
  EditorInputResult,
  EditorContentExpected,
  EditorContentValidateResult,
  EditorFillResult,
} from "../editor/editor.types";

export {
  NaverEditorError,
  NaverEditorAccessError,
  NaverEditorNotReadyError,
  NaverEditorValidationError,
} from "../editor/naver-editor.errors";

export { PublishManager, publishManager } from "../publish/publish.manager";
export type {
  PublishManagerDeps,
  NaverPublishPreparationRecord,
} from "../publish/publish.manager";
export type {
  NaverPublishInput,
  PublishResult,
  PublishValidateResult,
} from "../publish/publish.types";
export {
  NaverPublishError,
  NaverPublishFailedError,
  NaverPublishValidationError,
  NaverPublishTimeoutError,
} from "../publish/naver-publish.errors";

export type {
  NaverManager,
  NaverManagerContext,
} from "../managers/naver-manager.types";
export { resolveNaverBrowserMode } from "../managers/naver-manager.types";

export {
  NaverPublishingPreparationService,
  naverPublishingPreparationService,
} from "../preparation/naver-publishing-preparation.service";
export type { NaverPublishingPreparationResult } from "../preparation/naver-publishing-preparation.types";

export {
  NaverAutomationEngine,
  naverAutomationEngine,
} from "./naver-automation.engine";

export type { NaverAutomationEngineDeps } from "./naver-automation.engine";

export {
  NaverAccountRegistry,
  naverAccountRegistry,
} from "../accounts/account.registry";

export type {
  NaverAccountRecord,
  RegisterNaverAccountInput,
  NaverAccountCredentials,
} from "../accounts/account.types";
