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

const hasNaverCredentials =
  Boolean(process.env.NAVER_USERNAME?.trim()) &&
  Boolean(process.env.NAVER_PASSWORD?.trim()) &&
  Boolean(process.env.NAVER_SESSION_SECRET?.trim());

const explicitBrowserMode = process.env.NAVER_BROWSER_MODE?.trim().toLowerCase();

if (explicitBrowserMode === "mock") {
  process.env.NAVER_BROWSER_MODE = "mock";
} else if (explicitBrowserMode === "playwright") {
  process.env.NAVER_BROWSER_MODE = "playwright";
} else if (!hasNaverCredentials) {
  process.env.NAVER_BROWSER_MODE = "mock";
} else {
  process.env.NAVER_BROWSER_MODE = "playwright";
}

async function main() {
  const { resolveNaverBrowserMode } = await import(
    "../src/modules/publishing/naver/managers/naver-manager.types"
  );
  const { naverAutomationEngine } = await import(
    "../src/modules/publishing/naver/automation"
  );

  const browserMode = resolveNaverBrowserMode();
  const mockMode = browserMode === "mock";
  const provider = mockMode ? "Mock" : "Playwright";

  console.log(`Browser Mode : ${browserMode}`);
  console.log(`Provider : ${provider}`);

  if (!mockMode && !hasNaverCredentials) {
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

  try {
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

    const opened = await naverAutomationEngine.editor.openEditor(
      session?.pageId ?? undefined,
    );

    if (!opened.success || !opened.pageId) {
      console.log(
        JSON.stringify({
          status: "FAILED",
          durationMs: Date.now() - startedAt,
          mock: opened.mock,
          step: "openEditor",
          login: { success: login.success, mock: login.mock },
          message: opened.message,
        }),
      );
      process.exit(1);
    }

    const ready = await naverAutomationEngine.editor.waitEditorReady(opened.pageId);
    const validated = await naverAutomationEngine.editor.validateEditor(opened.pageId);

    const success = ready.ready && validated.valid;

    console.log(
      JSON.stringify(
        {
          status: success ? "SUCCESS" : "FAILED",
          durationMs: Date.now() - startedAt,
          mock: login.mock && opened.mock && ready.mock && validated.mock,
          login: {
            success: login.success,
            mock: login.mock,
            message: login.message,
            sessionId: login.sessionId,
          },
          openEditor: {
            success: opened.success,
            mock: opened.mock,
            pageId: opened.pageId,
            editorUrl: opened.editorUrl,
            message: opened.message,
          },
          waitEditorReady: {
            ready: ready.ready,
            mock: ready.mock,
            context: ready.context,
            message: ready.message,
          },
          validateEditor: {
            valid: validated.valid,
            mock: validated.mock,
            context: validated.context,
            editorUrl: validated.editorUrl,
            message: validated.message,
          },
        },
        null,
        2,
      ),
    );

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.log(
      JSON.stringify({
        status: "FAILED",
        durationMs: Date.now() - startedAt,
        mock: mockMode,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  } finally {
    await naverAutomationEngine.shutdown().catch(() => undefined);
  }
}

main();
