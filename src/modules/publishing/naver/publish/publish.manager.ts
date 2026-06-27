import { AppError } from "@/lib/errors";
import { blogHistoryService } from "@/modules/history";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { BrowserManager } from "../browser/browser.manager";
import { browserManager } from "../browser/browser.manager";
import type { EditorManager } from "../editor/editor.manager";
import { editorManager } from "../editor/editor.manager";
import type { LoginManager } from "../login/login.manager";
import { loginManager } from "../login/login.manager";
import { wrapNaverBrowserError } from "../login/naver-login.errors";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import type { SessionManager } from "../session/session.manager";
import { sessionManager } from "../session/session.manager";
import type {
  NaverAdapterPublishResult,
  NaverPublishPayload,
  NaverPublishStatusResult,
} from "../types/naver.types";
import {
  clearMockPublishRecord,
  getMockPublishRecord,
  saveMockPublishRecord,
} from "./mock-publish.state";
import {
  formatFailureDiagnosis,
  playwrightDebugSession,
} from "../playwright/playwright-debug";
import {
  extractNaverPostId,
  performNaverPublish,
} from "./naver-publish.helper";
import {
  NaverPublishFailedError,
} from "./naver-publish.errors";
import type {
  NaverPublishInput,
  PublishResult,
  PublishValidateResult,
} from "./publish.types";

export interface PublishManagerDeps {
  browser: BrowserManager;
  session: SessionManager;
  login: LoginManager;
  editor: EditorManager;
}

export interface NaverPublishPreparationRecord {
  historyId: string;
  publishPackage: PublishPackage;
  preparedAt: Date;
  sessionId: string;
  mock: boolean;
}

import { getPrimaryEditorWriteUrl } from "../editor/naver-editor.config";

interface StoredPublishRecord {
  historyId: string;
  publishedUrl: string;
  publishedAt: Date;
  naverPostId: string | null;
  sessionId: string | null;
  mock: boolean;
}

/**
 * Naver blog publish orchestration — real Playwright publish + mock provider.
 */
export class PublishManager implements NaverManager {
  private preparationRecords = new Map<string, NaverPublishPreparationRecord>();
  private publishRecords = new Map<string, StoredPublishRecord>();

  constructor(private readonly deps: PublishManagerDeps) {}

  async initialize(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    return (
      Boolean(context.publishPackage?.title?.trim()) &&
      Boolean(context.historyId) &&
      Boolean(context.pageId)
    );
  }

  async execute(context: NaverManagerContext): Promise<void> {
    const publishPackage = context.publishPackage;
    const historyId = context.historyId;
    const sessionId = context.sessionId;

    if (!publishPackage || !historyId || !sessionId) {
      throw new Error("PublishManager에 PublishPackage, historyId, sessionId가 필요합니다.");
    }

    const record: NaverPublishPreparationRecord = {
      historyId,
      publishPackage,
      preparedAt: new Date(),
      sessionId,
      mock: context.mock,
    };

    this.preparationRecords.set(historyId, record);
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async validatePublish(
    pageId: string,
    publishPackage: PublishPackage,
  ): Promise<PublishValidateResult> {
    const validation = await this.deps.editor.validateContent(pageId, {
      title: publishPackage.title,
      content: publishPackage.content,
      hashtags: [],
    });

    const valid =
      validation.titleEntered &&
      validation.contentEntered &&
      validation.contentLengthOk;

    return {
      valid,
      pageId,
      titleReady: validation.titleEntered,
      contentReady: validation.contentEntered && validation.contentLengthOk,
      message: valid
        ? "발행 전 검증 성공"
        : validation.message || "발행 전 검증에 실패했습니다.",
      mock: validation.mock,
    };
  }

  async publish(input: NaverPublishInput): Promise<PublishResult> {
    const startedAt = Date.now();
    const retryCount = input.retryCount ?? 0;
    const mock = this.deps.browser.isMockMode();

    try {
      await blogHistoryService.markPublishing(input.historyId);
    } catch (error) {
      return this.buildFailureResult({
        input,
        startedAt,
        retryCount,
        mock,
        errorCode: "HISTORY_UPDATE_FAILED",
        errorMessage:
          error instanceof Error ? error.message : "History 상태 업데이트에 실패했습니다.",
      });
    }

    const validation = await this.validatePublish(input.pageId, input.publishPackage);

    if (!validation.valid) {
      return this.buildFailureResult({
        input,
        startedAt,
        retryCount,
        mock,
        errorCode: "NAVER_PUBLISH_VALIDATION_FAILED",
        errorMessage: validation.message,
      });
    }

    try {
      if (mock) {
        return await this.publishMock(input, startedAt, retryCount);
      }

      return await this.publishPlaywright(input, startedAt, retryCount);
    } catch (error) {
      const wrapped = wrapNaverBrowserError(error);

      return this.buildFailureResult({
        input,
        startedAt,
        retryCount,
        mock,
        errorCode: wrapped instanceof AppError ? wrapped.code : "NAVER_PUBLISH_FAILED",
        errorMessage: wrapped.message,
      });
    }
  }

  getPublishedUrl(historyId: string): string | null {
    const record = this.publishRecords.get(historyId) ?? getMockPublishRecord(historyId);

    if (!record) {
      return null;
    }

    return record.publishedUrl;
  }

  async preparePublish(context: NaverManagerContext): Promise<NaverPublishPreparationRecord> {
    const publishPackage = context.publishPackage;
    const historyId = context.historyId;
    const sessionId = context.sessionId;

    if (!publishPackage || !historyId) {
      throw new Error("PublishManager에 PublishPackage와 historyId가 필요합니다.");
    }

    if (!sessionId) {
      throw new Error("PublishManager에 유효한 sessionId가 필요합니다.");
    }

    const isValid = context.mock || (await this.deps.login.validateSession(sessionId));

    if (!isValid) {
      throw new Error("유효하지 않은 네이버 세션입니다. 다시 로그인해 주세요.");
    }

    const session = this.deps.session.touch(sessionId);

    if (!session) {
      throw new Error("네이버 세션을 찾을 수 없습니다.");
    }

    if (session.pageId) {
      await this.deps.browser.navigate(session.pageId, getPrimaryEditorWriteUrl());
    } else {
      const page = await this.deps.browser.createPage(getPrimaryEditorWriteUrl());
      context.pageId = page.id;
    }

    const record: NaverPublishPreparationRecord = {
      historyId,
      publishPackage,
      preparedAt: new Date(),
      sessionId,
      mock: context.mock,
    };

    this.preparationRecords.set(historyId, record);

    return record;
  }

  async prepareFromPackage(
    publishPackage: PublishPackage,
    historyId: string,
    sessionId: string,
    mock = true,
  ): Promise<NaverPublishPreparationRecord> {
    const context: NaverManagerContext = {
      publishPackage,
      historyId,
      sessionId,
      mock,
    };

    return this.preparePublish(context);
  }

  getPreparationRecord(historyId: string): NaverPublishPreparationRecord | null {
    return this.preparationRecords.get(historyId) ?? null;
  }

  /** Adapter compatibility for legacy NaverPublishPayload flow */
  async publishAdapter(
    sessionId: string,
    payload: NaverPublishPayload,
  ): Promise<NaverAdapterPublishResult> {
    const externalId = `naver-pw-${payload.historyId}-${Date.now()}`;
    const url = `https://blog.naver.com/mock/${externalId}`;
    const publishedAt = new Date();

    this.publishRecords.set(payload.historyId, {
      historyId: payload.historyId,
      publishedUrl: url,
      publishedAt,
      naverPostId: externalId,
      sessionId,
      mock: true,
    });

    return {
      externalId,
      url,
      publishedAt,
      mock: true,
    };
  }

  async getPublishStatus(
    sessionId: string,
    externalId: string,
  ): Promise<NaverPublishStatusResult> {
    const record = Array.from(this.publishRecords.values()).find(
      (item) => item.naverPostId === externalId && item.sessionId === sessionId,
    );

    if (!record) {
      return {
        externalId,
        status: "failed",
        url: null,
        message: "발행 기록을 찾을 수 없습니다.",
        mock: true,
      };
    }

    return {
      externalId,
      status: "published",
      url: record.publishedUrl,
      message: "발행 완료",
      mock: record.mock,
    };
  }

  private async publishMock(
    input: NaverPublishInput,
    startedAt: number,
    retryCount: number,
  ): Promise<PublishResult> {
    const publishedAt = new Date();
    const naverPostId = `mock-${input.historyId}-${publishedAt.getTime()}`;
    const publishedUrl = `https://blog.naver.com/mock/${naverPostId}`;

    saveMockPublishRecord({
      historyId: input.historyId,
      publishedUrl,
      publishedAt,
      naverPostId,
    });

    this.publishRecords.set(input.historyId, {
      historyId: input.historyId,
      publishedUrl,
      publishedAt,
      naverPostId,
      sessionId: input.sessionId ?? null,
      mock: true,
    });

    await blogHistoryService.markPublished(input.historyId, {
      naverPostId,
      publishUrl: publishedUrl,
    });

    return {
      success: true,
      publishedUrl,
      publishedAt: publishedAt.toISOString(),
      elapsedTime: Date.now() - startedAt,
      errorCode: null,
      errorMessage: null,
      retryCount,
      mock: true,
      historyId: input.historyId,
      naverPostId,
    };
  }

  private async publishPlaywright(
    input: NaverPublishInput,
    startedAt: number,
    retryCount: number,
  ): Promise<PublishResult> {
    const page =
      this.deps.browser.resolvePage(input.pageId) ??
      (await this.deps.browser.getActivePage());

    if (!page) {
      throw new NaverPublishFailedError("발행 페이지를 찾을 수 없습니다.");
    }

    await playwrightDebugSession.startTrace(page);

    try {
      const publishedUrl = await performNaverPublish(page, input.publishPackage.title);
      const publishedAt = new Date();
      const naverPostId = extractNaverPostId(publishedUrl);

      this.publishRecords.set(input.historyId, {
        historyId: input.historyId,
        publishedUrl,
        publishedAt,
        naverPostId,
        sessionId: input.sessionId ?? null,
        mock: false,
      });

      await blogHistoryService.markPublished(input.historyId, {
        naverPostId: naverPostId ?? `naver-${publishedAt.getTime()}`,
        publishUrl: publishedUrl,
      });

      await playwrightDebugSession.saveArtifacts(page, "publish-success");

      return {
        success: true,
        publishedUrl,
        publishedAt: publishedAt.toISOString(),
        elapsedTime: Date.now() - startedAt,
        errorCode: null,
        errorMessage: null,
        retryCount,
        mock: false,
        historyId: input.historyId,
        naverPostId,
      };
    } catch (error) {
      const diagnosis = await playwrightDebugSession.saveArtifacts(page, "publish", error);

      if (diagnosis) {
        console.error(formatFailureDiagnosis(diagnosis));
      }

      throw error;
    }
  }

  private async buildFailureResult(params: {
    input: NaverPublishInput;
    startedAt: number;
    retryCount: number;
    mock: boolean;
    errorCode: string;
    errorMessage: string;
  }): Promise<PublishResult> {
    const { input, startedAt, retryCount, mock, errorCode, errorMessage } = params;

    try {
      await blogHistoryService.markPublishFailed(input.historyId, {
        errorCode,
        errorMessage,
        retryCount,
      });
    } catch {
      // History update failure should not mask publish failure.
    }

    if (mock) {
      clearMockPublishRecord(input.historyId);
    }

    return {
      success: false,
      publishedUrl: null,
      publishedAt: null,
      elapsedTime: Date.now() - startedAt,
      errorCode,
      errorMessage,
      retryCount,
      mock,
      historyId: input.historyId,
      naverPostId: null,
    };
  }
}

export const publishManager = new PublishManager({
  browser: browserManager,
  session: sessionManager,
  login: loginManager,
  editor: editorManager,
});
