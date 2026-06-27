import type { JobProgressUpdate } from "@/types/job";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import { naverAutomationEngine } from "../automation/naver-automation.engine";
import { markdownToPlainText } from "../editor/markdown-to-naver.converter";
import type { PublishResult } from "../publish/publish.types";

export type NaverFullPublishStep =
  | "login"
  | "editor"
  | "input"
  | "draft"
  | "publish"
  | "complete";

export class NaverFullPublishStepError extends Error {
  readonly step: NaverFullPublishStep;

  constructor(step: NaverFullPublishStep, message: string) {
    super(`[${step}] ${message}`);
    this.name = "NaverFullPublishStepError";
    this.step = step;
  }
}

export interface NaverFullPublishOptions {
  onProgress?: (update: JobProgressUpdate) => Promise<void> | void;
}

export interface NaverFullPublishResult {
  success: boolean;
  mock: boolean;
  historyId: string;
  publishPackage: PublishPackage;
  publishedUrl: string | null;
  publishedAt: string | null;
  naverPostId: string | null;
  sessionId: string | null;
  pageId: string | null;
  message: string;
  failedStep?: NaverFullPublishStep;
  publishResult?: PublishResult;
}

const STEP_LABELS: Record<NaverFullPublishStep, string> = {
  login: "🔐 네이버 로그인 중...",
  editor: "📝 에디터 열기...",
  input: "✍️ 글 입력 중...",
  draft: "💾 임시저장 중...",
  publish: "🚀 발행 중...",
  complete: "✅ 완료",
};

async function reportStep(
  options: NaverFullPublishOptions | undefined,
  step: NaverFullPublishStep,
): Promise<void> {
  if (!options?.onProgress) {
    return;
  }

  await options.onProgress({
    status: step === "complete" ? "COMPLETED" : "GENERATING",
    progress: step === "complete" ? 100 : 80,
    stepLabel: STEP_LABELS[step],
  });
}

function logStep(step: NaverFullPublishStep, message: string, extra?: unknown): void {
  const payload = extra === undefined ? message : `${message} ${JSON.stringify(extra)}`;
  console.info(`[naver-full-publish:${step}] ${payload}`);
}

export class NaverFullPublishService {
  async publish(
    publishPackage: PublishPackage,
    historyId: string,
    options?: NaverFullPublishOptions,
  ): Promise<NaverFullPublishResult> {
    const engine = naverAutomationEngine;
    let pageId: string | null = null;
    let sessionId: string | null = null;

    try {
      await reportStep(options, "login");
      logStep("login", "start");

      const login = await engine.ensureLoggedIn();

      if (!login.success) {
        throw new NaverFullPublishStepError("login", login.message);
      }

      sessionId = login.sessionId ?? null;
      logStep("login", "success", { sessionId, mock: login.mock });

      await reportStep(options, "editor");
      logStep("editor", "start");

      const session = sessionId ? engine.session.get(sessionId) : null;
      const opened = await engine.editor.ensureEditorReady(session?.pageId ?? undefined);

      if (!opened.success || !opened.pageId) {
        await engine.editor
          .saveDebugArtifacts(opened.pageId ?? "unknown", opened.message)
          .catch(() => undefined);
        throw new NaverFullPublishStepError("editor", opened.message);
      }

      pageId = opened.pageId;

      const ready = await engine.editor.waitEditorReady(opened.pageId);

      if (!ready.ready) {
        await engine.editor
          .saveDebugArtifacts(opened.pageId, ready.message)
          .catch(() => undefined);
        throw new NaverFullPublishStepError("editor", ready.message);
      }

      logStep("editor", "success", { pageId: opened.pageId });

      await reportStep(options, "input");
      logStep("input", "start");

      const titleResult = await engine.editor.setTitle(opened.pageId, publishPackage.title);

      if (!titleResult.success) {
        throw new NaverFullPublishStepError(
          "input",
          titleResult.message || "제목 입력에 실패했습니다.",
        );
      }

      const contentResult = await engine.editor.setContent(
        opened.pageId,
        publishPackage.content,
      );

      if (!contentResult.success) {
        throw new NaverFullPublishStepError(
          "input",
          contentResult.message || "본문 입력에 실패했습니다.",
        );
      }

      const expectedPlainLength = markdownToPlainText(publishPackage.content).length;
      const contentValidation = await engine.editor.validateContent(opened.pageId, {
        title: publishPackage.title,
        content: publishPackage.content,
        hashtags: [],
        minContentLength: Math.max(10, Math.floor(expectedPlainLength * 0.5)),
      });

      if (!contentValidation.contentLengthOk || !contentValidation.titleEntered) {
        throw new NaverFullPublishStepError(
          "input",
          contentValidation.message || "입력 내용 검증에 실패했습니다.",
        );
      }

      logStep("input", "success", {
        title: contentValidation.actualTitle,
        contentLength: contentValidation.actualContentLength,
      });

      await reportStep(options, "draft");
      logStep("draft", "start");

      const draftResult = await engine.editor.saveDraft(opened.pageId);

      if (!draftResult.success) {
        throw new NaverFullPublishStepError(
          "draft",
          draftResult.message || "임시저장에 실패했습니다.",
        );
      }

      logStep("draft", "success", { message: draftResult.message });

      await reportStep(options, "publish");
      logStep("publish", "start");

      const publishResult = await engine.publish.publish({
        pageId: opened.pageId,
        historyId,
        publishPackage,
        sessionId: sessionId ?? undefined,
        retryCount: 0,
      });

      if (!publishResult.success) {
        await engine.editor
          .saveDebugArtifacts(
            opened.pageId,
            publishResult.errorMessage ?? "publish-failed",
            false,
            true,
          )
          .catch(() => undefined);

        throw new NaverFullPublishStepError(
          "publish",
          publishResult.errorMessage || "네이버 발행에 실패했습니다.",
        );
      }

      logStep("publish", "success", {
        publishedUrl: publishResult.publishedUrl,
        naverPostId: publishResult.naverPostId,
      });

      await reportStep(options, "complete");

      return {
        success: true,
        mock: publishResult.mock,
        historyId,
        publishPackage,
        publishedUrl: publishResult.publishedUrl,
        publishedAt: publishResult.publishedAt ?? null,
        naverPostId: publishResult.naverPostId ?? null,
        sessionId,
        pageId,
        message: publishResult.publishedUrl
          ? `발행 완료: ${publishResult.publishedUrl}`
          : "발행 완료",
        publishResult,
      };
    } catch (error) {
      const failedStep =
        error instanceof NaverFullPublishStepError ? error.step : undefined;
      const message =
        error instanceof Error ? error.message : "네이버 발행 중 알 수 없는 오류가 발생했습니다.";

      logStep(failedStep ?? "publish", "failed", { message, pageId, sessionId });

      if (pageId) {
        await engine.editor
          .saveDebugArtifacts(pageId, message)
          .catch(() => undefined);
      }

      throw error;
    } finally {
      await engine.shutdown().catch(() => undefined);
    }
  }
}

export const naverFullPublishService = new NaverFullPublishService();
