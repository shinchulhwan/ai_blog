import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { PublishPackage } from "../src/modules/publishing/types/publish-package.types";

function loadEnvFile(filename: string): void {
  const filePath = resolve(process.cwd(), filename);

  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const hasNaverCredentials =
  Boolean(process.env.NAVER_USERNAME?.trim()) &&
  Boolean(process.env.NAVER_PASSWORD?.trim()) &&
  Boolean(process.env.NAVER_SESSION_SECRET?.trim());

process.env.NAVER_BROWSER_MODE = "playwright";

function createSamplePublishPackage(): PublishPackage {
  const now = new Date().toISOString();
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  return {
    title: `[Real Publish Sprint] ${stamp}`,
    metaDescription: "Real Publish Sprint Part 1 테스트",
    content: [
      "**Real Publish Sprint Part 1** 본문 테스트입니다.",
      "",
      "- Playwright Provider 실제 실행",
      "- 제목/본문 입력 검증",
      "- 임시저장 우선 수행",
      "",
      `생성 시각: ${stamp}`,
    ].join("\n"),
    faq: [],
    hashtags: ["RealPublish", "자동화테스트"],
    images: {
      coverPrompt: "",
      contentImages: [],
      thumbnailText: "",
      altTexts: [],
      fileNames: [],
    },
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

async function main() {
  const { resolveNaverBrowserMode } = await import(
    "../src/modules/publishing/naver/managers/naver-manager.types"
  );
  const { projectService } = await import("../src/modules/project");
  const { blogHistoryService } = await import("../src/modules/history");
  const { naverAutomationEngine } = await import(
    "../src/modules/publishing/naver/automation"
  );
  const { markdownToPlainText } = await import(
    "../src/modules/publishing/naver/editor/markdown-to-naver.converter"
  );

  const browserMode = resolveNaverBrowserMode();
  const provider = browserMode === "mock" ? "Mock" : "Playwright";

  console.log(`Browser Mode : ${browserMode}`);
  console.log(`Provider : ${provider}`);

  if (!hasNaverCredentials) {
    console.log(
      JSON.stringify({
        status: "SKIPPED",
        reason:
          "Playwright 모드: NAVER_USERNAME, NAVER_PASSWORD, NAVER_SESSION_SECRET required in .env.local",
      }),
    );
    process.exit(0);
  }

  const startedAt = Date.now();
  const publishPackage = createSamplePublishPackage();
  let projectId: string | null = null;
  let historyId: string | null = null;
  let pageId: string | null = null;

  try {
    const project = await projectService.create({
      name: `Naver Publish Test ${Date.now()}`,
      description: "Real Publish Sprint Part 1",
    });
    projectId = project.id;

    const history = await blogHistoryService.saveFromBlogResult(
      "naver-publish-test",
      {
        selectedTitle: publishPackage.title,
        content: publishPackage.content,
        metaDescription: publishPackage.metaDescription,
        hashtags: publishPackage.hashtags,
        faq: publishPackage.faq,
        representativeImagePrompt: "",
        bodyImagePrompts: [],
        thumbnailText: "",
        altTags: { representative: "", body: [] },
        imageFilenames: { representative: "", body: [] },
        seoScore: 80,
      },
      "READY",
      project.id,
    );
    historyId = history.id;

    const login = await naverAutomationEngine.ensureLoggedIn();

    if (!login.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: login.mock,
          step: "ensureLoggedIn",
          message: login.message,
        }),
      );
      process.exit(1);
    }

    const session = login.sessionId
      ? naverAutomationEngine.session.get(login.sessionId)
      : null;

    const opened = await naverAutomationEngine.editor.ensureEditorReady(
      session?.pageId ?? undefined,
    );

    if (!opened.success || !opened.pageId) {
      await naverAutomationEngine.editor
        .saveDebugArtifacts(opened.pageId ?? "unknown", opened.message)
        .catch(() => undefined);

      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: opened.mock,
          step: "openEditor",
          message: opened.message,
        }),
      );
      process.exit(1);
    }

    pageId = opened.pageId;

    await naverAutomationEngine.editor
      .saveDebugArtifacts(opened.pageId, "editor-entry", true, false)
      .catch(() => undefined);

    const ready = await naverAutomationEngine.editor.waitEditorReady(opened.pageId);
    const diagnostics = await naverAutomationEngine.editor.getEditorDiagnostics(opened.pageId);

    console.log(`현재 URL : ${diagnostics.currentUrl}`);
    console.log(`최종 URL : ${diagnostics.finalUrl}`);
    console.log(`iframe : ${diagnostics.usesIframe}`);
    console.log(
      `Editor Selector : title=${diagnostics.titleSelector ?? "none"}, content=${diagnostics.contentSelector ?? "none"}`,
    );

    if (!ready.ready) {
      await naverAutomationEngine.editor
        .saveDebugArtifacts(opened.pageId, ready.message)
        .catch(() => undefined);

      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: ready.mock,
          step: "waitEditorReady",
          editorEntry: diagnostics,
          message: ready.message,
        }),
      );
      process.exit(1);
    }

    const titleResult = await naverAutomationEngine.editor.setTitle(
      opened.pageId,
      publishPackage.title,
    );

    const titleValidation = await naverAutomationEngine.editor.validateContent(
      opened.pageId,
      {
        title: publishPackage.title,
        content: "",
        hashtags: [],
        minContentLength: 0,
      },
    );

    console.log(
      `제목 입력 검증 : entered=${titleValidation.titleEntered}, actual="${titleValidation.actualTitle}"`,
    );

    if (!titleResult.success || !titleValidation.titleEntered) {
      await naverAutomationEngine.editor
        .saveDebugArtifacts(opened.pageId, titleResult.message)
        .catch(() => undefined);

      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: titleResult.mock,
          step: "setTitle",
          titleResult,
          titleValidation,
        }),
      );
      process.exit(1);
    }

    await naverAutomationEngine.editor
      .saveDebugArtifacts(opened.pageId, "setTitle", true, false)
      .catch(() => undefined);

    const contentResult = await naverAutomationEngine.editor.setContent(
      opened.pageId,
      publishPackage.content,
    );

    const expectedPlainLength = markdownToPlainText(publishPackage.content).length;
    const contentValidation = await naverAutomationEngine.editor.validateContent(
      opened.pageId,
      {
        title: publishPackage.title,
        content: publishPackage.content,
        hashtags: [],
        minContentLength: Math.max(10, Math.floor(expectedPlainLength * 0.5)),
      },
    );

    console.log(
      `본문 입력 검증 : length=${contentValidation.actualContentLength}, expected>=${contentValidation.expectedContentLength}`,
    );

    if (!contentResult.success || !contentValidation.contentLengthOk) {
      await naverAutomationEngine.editor
        .saveDebugArtifacts(opened.pageId, contentResult.message)
        .catch(() => undefined);

      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: contentResult.mock,
          step: "setContent",
          contentResult,
          contentValidation,
        }),
      );
      process.exit(1);
    }

    const draftResult = await naverAutomationEngine.editor.saveDraft(opened.pageId);

    console.log(
      `임시저장 : success=${draftResult.success}, message=${draftResult.message}`,
    );

    await naverAutomationEngine.editor
      .saveDebugArtifacts(opened.pageId, "setContent", true, false)
      .catch(() => undefined);

    await naverAutomationEngine.editor
      .saveDebugArtifacts(opened.pageId, "tempSave", draftResult.success, false)
      .catch(() => undefined);

    if (!draftResult.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: false,
          step: "tempSave",
          saveDraft: draftResult,
        }),
      );
      process.exit(1);
    }

    console.log("임시저장 성공 — 실제 발행을 진행합니다.");

    const publishResult = await naverAutomationEngine.publish.publish({
      pageId: opened.pageId,
      historyId: history.id,
      publishPackage,
      sessionId: login.sessionId ?? undefined,
      retryCount: 0,
    });

    const success = Boolean(publishResult.success);

    await naverAutomationEngine.editor
      .saveDebugArtifacts(
        opened.pageId,
        success ? "publish-success" : "publish-failed",
        success,
        true,
      )
      .catch(() => undefined);

    if (success) {
      console.log(`발행 성공 : ${publishResult.publishedUrl ?? "URL 없음"}`);
    } else {
      console.log(`발행 실패 : ${publishResult.errorMessage ?? "unknown"}`);
    }

    const updatedHistory = historyId ? await blogHistoryService.getById(historyId) : null;
    const publishedUrl = historyId
      ? naverAutomationEngine.publish.getPublishedUrl(historyId)
      : null;

    console.log(
      JSON.stringify(
        {
          status: success ? "SUCCESS" : "FAILED",
          durationMs: Date.now() - startedAt,
          mock: false,
          login: {
            success: login.success,
            mock: login.mock,
            sessionId: login.sessionId,
          },
          editorEntry: {
            currentUrl: diagnostics.currentUrl,
            finalUrl: diagnostics.finalUrl,
            iframe: diagnostics.usesIframe,
            titleSelector: diagnostics.titleSelector,
            contentSelector: diagnostics.contentSelector,
            ready: ready.ready,
            mock: ready.mock,
          },
          setTitle: {
            success: titleResult.success,
            mock: titleResult.mock,
            titleEntered: titleValidation.titleEntered,
            actualTitle: titleValidation.actualTitle,
          },
          setContent: {
            success: contentResult.success,
            mock: contentResult.mock,
            actualContentLength: contentValidation.actualContentLength,
            expectedContentLength: contentValidation.expectedContentLength,
          },
          tempSave: draftResult,
          publish: publishResult,
          getPublishedUrl: publishedUrl,
          history: updatedHistory
            ? {
                status: updatedHistory.status,
                publishUrl: updatedHistory.publishUrl,
                publishedAt: updatedHistory.publishedAt,
                publishError: updatedHistory.publishError,
              }
            : null,
        },
        null,
        2,
      ),
    );

    process.exit(success ? 0 : 1);
  } catch (error) {
    if (pageId) {
      await naverAutomationEngine.editor
        .saveDebugArtifacts(pageId, error instanceof Error ? error.message : String(error))
        .catch(() => undefined);
    }

    console.log(
      JSON.stringify({
        status: "FAILED",
        durationMs: Date.now() - startedAt,
        mock: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  } finally {
    await naverAutomationEngine.shutdown().catch(() => undefined);

    if (projectId) {
      await projectService.delete(projectId).catch(() => undefined);
    }
  }
}

main();
