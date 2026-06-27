import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

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

process.env.NAVER_BROWSER_MODE = "playwright";
process.env.NAVER_EDITOR_HEADLESS = "false";

const hasNaverCredentials =
  Boolean(process.env.NAVER_USERNAME?.trim()) &&
  Boolean(process.env.NAVER_PASSWORD?.trim()) &&
  Boolean(process.env.NAVER_SESSION_SECRET?.trim());

async function main() {
  const { resolveNaverBrowserMode } = await import(
    "../src/modules/publishing/naver/managers/naver-manager.types"
  );
  const { naverAutomationEngine } = await import(
    "../src/modules/publishing/naver/automation"
  );
  const { inspectNaverLiveEditor, pauseForLiveInspection } = await import(
    "../src/modules/publishing/naver/inspector/naver-live-inspector"
  );

  const browserMode = resolveNaverBrowserMode();
  const provider = browserMode === "mock" ? "Mock" : "Playwright";

  console.log(`Browser Mode : ${browserMode}`);
  console.log(`Provider : ${provider}`);
  console.log(`Headless : false`);
  console.log(`PWDEBUG : ${process.env.PWDEBUG === "1" ? "1" : "0"}`);

  if (!hasNaverCredentials) {
    console.log(
      JSON.stringify({
        status: "SKIPPED",
        reason:
          "NAVER_USERNAME, NAVER_PASSWORD, NAVER_SESSION_SECRET required in .env.local",
      }),
    );
    process.exit(0);
  }

  const startedAt = Date.now();

  try {
    const login = await naverAutomationEngine.ensureLoggedIn();

    if (!login.success) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          step: "ensureLoggedIn",
          mock: login.mock,
          message: login.message,
        }),
      );
      process.exit(1);
    }

    const session = login.sessionId
      ? naverAutomationEngine.session.get(login.sessionId)
      : null;

    const opened = await naverAutomationEngine.editor.openEditor(session?.pageId ?? undefined);

    if (!opened.success || !opened.pageId) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          step: "openEditor",
          mock: opened.mock,
          message: opened.message,
        }),
      );
      process.exit(1);
    }

    const ready = await naverAutomationEngine.editor.waitEditorReady(opened.pageId);

    if (!ready.ready) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          step: "waitEditorReady",
          mock: ready.mock,
          message: ready.message,
        }),
      );
      process.exit(1);
    }

    const context = await naverAutomationEngine.browser.getContext();
    const pages = context.pages().filter((item) => !item.isClosed());
    const page = pages.length > 0 ? pages[pages.length - 1]! : null;

    if (!page) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          step: "inspect",
          message: "활성 Playwright 페이지를 찾을 수 없습니다.",
        }),
      );
      process.exit(1);
    }

    const inspection = await inspectNaverLiveEditor(page);

    console.log(
      JSON.stringify(
        {
          status: "SUCCESS",
          durationMs: Date.now() - startedAt,
          mock: false,
          summary: {
            url: inspection.url,
            title: inspection.title,
            frameCount: inspection.frames.length,
            contenteditableCount: inspection.contenteditable.length,
            textareaCount: inspection.textareas.length,
            inputCount: inspection.inputs.length,
            proseMirrorCount: inspection.proseMirror.length,
            buttonCount: inspection.buttons.length,
            ariaLabelCount: inspection.ariaLabels.length,
            roleCount: inspection.roles.length,
            dataAttributeCount: inspection.dataAttributes.length,
            selectorCandidateCount: inspection.selectorCandidates.length,
          },
          frames: inspection.frames,
          inputs: inspection.inputs,
          textareas: inspection.textareas,
          contenteditable: inspection.contenteditable,
          proseMirror: inspection.proseMirror,
          ariaLabels: inspection.ariaLabels.slice(0, 50),
          roles: inspection.roles.slice(0, 50),
          dataAttributes: inspection.dataAttributes.slice(0, 50),
          editorSelectors: inspection.editorSelectors,
          artifacts: {
            pageHtml: "debug/page.html",
            selectorsJson: "debug/selectors.json",
            buttonsJson: "debug/buttons.json",
            framesJson: "debug/frames.json",
            editorJson: "debug/editor.json",
            pagePng: "debug/page.png",
            traceZip: "debug/trace.zip",
          },
        },
        null,
        2,
      ),
    );

    if (process.env.PWDEBUG === "1") {
      await pauseForLiveInspection(page);
    }
  } catch (error) {
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
  }
}

main();
