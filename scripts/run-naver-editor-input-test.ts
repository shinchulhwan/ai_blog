import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { PublishPackage } from "../src/modules/publishing/types/publish-package.types";
import {
  EDITOR_INPUT_TIMEOUT_MS,
  EditorInputStepTimeoutError,
  runEditorInputStep,
} from "../src/modules/publishing/naver/editor/editor-input-step-logger";

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

process.env.NAVER_EDITOR_INPUT_VERBOSE = "1";

const hasNaverCredentials =
  Boolean(process.env.NAVER_USERNAME?.trim()) &&
  Boolean(process.env.NAVER_PASSWORD?.trim()) &&
  Boolean(process.env.NAVER_SESSION_SECRET?.trim());

if (!hasNaverCredentials) {
  process.env.NAVER_ALLOW_MOCK = "true";
  process.env.NAVER_BROWSER_MODE = "mock";
} else {
  process.env.NAVER_BROWSER_MODE ??= "playwright";
}

function createSamplePublishPackage(): PublishPackage {
  const now = new Date().toISOString();

  return {
    title: "에디터 입력 테스트",
    metaDescription: "Naver Editor Input Engine 테스트",
    content: [
      "**굵은 글씨** 테스트입니다.",
      "",
      "- 첫 번째 항목",
      "- 두 번째 항목",
      "",
      "1. 순서 목록 1",
      "2. 순서 목록 2",
      "",
      "링크: [네이버](https://www.naver.com)",
    ].join("\n"),
    faq: [],
    hashtags: ["테스트", "자동화", "에디터"],
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
  const { naverAutomationEngine } = await import(
    "../src/modules/publishing/naver/automation"
  );
  const { browserManager } = await import(
    "../src/modules/publishing/naver/browser/browser.manager"
  );

  const mockMode = resolveNaverBrowserMode() === "mock";
  const startedAt = Date.now();
  const publishPackage = createSamplePublishPackage();

  const getPageDebugContext = async (pageId: string) => {
    const page = browserManager.resolvePage(pageId) ?? undefined;
    return { page, selector: "n/a" };
  };

  try {
    const login = await naverAutomationEngine.ensureLoggedIn();

    if (!login.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "ensureLoggedIn",
          message: login.message,
        }),
      );
      process.exit(1);
    }

    const session = login.sessionId
      ? naverAutomationEngine.session.get(login.sessionId)
      : null;

    const opened = await runEditorInputStep(
      1,
      "naverAutomationEngine.editor.ensureEditorReady",
      () => naverAutomationEngine.editor.ensureEditorReady(session?.pageId ?? undefined),
    );

    if (!opened.success || !opened.pageId) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "ensureEditorReady",
          message: opened.message,
        }),
      );
      process.exit(1);
    }

    const ready = await runEditorInputStep(
      2,
      `waitEditorReady(timeout=${EDITOR_INPUT_TIMEOUT_MS})`,
      () =>
        naverAutomationEngine.editor.waitEditorReady(
          opened.pageId!,
          EDITOR_INPUT_TIMEOUT_MS,
        ),
      () => getPageDebugContext(opened.pageId!),
    );

    if (!ready.ready) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "waitEditorReady",
          message: ready.message,
        }),
      );
      process.exit(1);
    }

    console.log("[2] Wait Editor - after");

    const titleResult = await naverAutomationEngine.editor.setTitle(
      opened.pageId!,
      publishPackage.title,
    );

    if (!titleResult.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "setTitle",
          message: titleResult.message,
        }),
      );
      process.exit(1);
    }

    const contentResult = await naverAutomationEngine.editor.setContent(
      opened.pageId!,
      publishPackage.content,
    );

    if (!contentResult.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "setContent",
          message: contentResult.message,
        }),
      );
      process.exit(1);
    }

    const draftResult = await naverAutomationEngine.editor.saveDraft(opened.pageId!);

    if (!draftResult.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: "saveDraft",
          message: draftResult.message,
        }),
      );
      process.exit(1);
    }

    console.log(
      JSON.stringify(
        {
          status: "SUCCESS",
          durationMs: Date.now() - startedAt,
          mock: mockMode,
          login: {
            success: login.success,
            sessionId: login.sessionId,
          },
          ensureEditorReady: {
            success: opened.success,
            pageId: opened.pageId,
            message: opened.message,
          },
          setTitle: titleResult,
          setContent: contentResult,
          saveDraft: draftResult,
        },
        null,
        2,
      ),
    );

    process.exit(0);
  } catch (error) {
    if (error instanceof EditorInputStepTimeoutError) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          step: error.step,
          message: error.message,
        }),
      );
      process.exit(1);
    }

    console.log(
      JSON.stringify({
        status: "FAILED",
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  } finally {
    await naverAutomationEngine.shutdown().catch(() => undefined);
  }
}

main();
