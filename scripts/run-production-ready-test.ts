import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { getOpenAIClient } from "../src/lib/openai/client";
import { registerWorkflows } from "../src/modules/workflow/register-workflows";
import { workflowEngine } from "../src/modules/workflow/engine/workflow-engine";
import { e2eWorkflowTestWorkflow } from "../src/modules/integration-test/workflows/e2e-workflow-test.workflow";

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

const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());

process.env.IMAGE_PROVIDER ??= "mock";
process.env.NAVER_BROWSER_MODE = hasNaverCredentials ? "playwright" : "mock";

if (!hasOpenAiKey) {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_MODEL ??= "gpt-4o";
}

async function main() {
  const { resolveNaverBrowserMode } = await import(
    "../src/modules/publishing/naver/managers/naver-manager.types"
  );
  const { formatFailureDiagnosis } = await import(
    "../src/modules/publishing/naver/playwright/playwright-failure-diagnosis"
  );

  const browserMode = resolveNaverBrowserMode();
  const provider = browserMode === "mock" ? "Mock" : "Playwright";
  const startedAt = Date.now();

  console.log(`Browser Mode : ${browserMode}`);
  console.log(`Provider : ${provider}`);
  console.log(`OpenAI : ${hasOpenAiKey ? "real" : "mock-fixtures"}`);

  registerWorkflows();
  workflowEngine.register(e2eWorkflowTestWorkflow);

  try {
    const result = await workflowEngine.run("e2e-workflow-test", undefined, {
      keyword: "production-ready-test",
      client: hasOpenAiKey ? getOpenAIClient() : ({} as never),
      projectId: "production-ready-test",
    });

    const publishPackageCreated = Boolean(result.summary?.publishPackageCreated);
    const workflowSuccess = result.status === "SUCCESS";

    let naverStep: Record<string, unknown> = { skipped: true, reason: "no credentials" };

    if (hasNaverCredentials && browserMode === "playwright") {
      const { naverAutomationEngine } = await import(
        "../src/modules/publishing/naver/automation"
      );
      const { tryNaverTempSave } = await import(
        "../src/modules/publishing/naver/publish/naver-publish.helper"
      );

      try {
        const login = await naverAutomationEngine.ensureLoggedIn();

        if (!login.success) {
          naverStep = { success: false, step: "login", message: login.message, mock: login.mock };
        } else {
          const session = login.sessionId
            ? naverAutomationEngine.session.get(login.sessionId)
            : null;
          const opened = await naverAutomationEngine.editor.openEditor(session?.pageId ?? undefined);
          const ready = opened.success && opened.pageId
            ? await naverAutomationEngine.editor.waitEditorReady(opened.pageId)
            : { ready: false, mock: false, message: opened.message };

          const context = await naverAutomationEngine.browser.getContext();
          const page = context.pages().filter((item) => !item.isClosed()).at(-1) ?? null;
          const tempSave = page ? await tryNaverTempSave(page) : null;

          naverStep = {
            success: Boolean(opened.success && ready.ready),
            mock: false,
            openEditor: opened.success,
            editorReady: ready.ready,
            tempSave,
          };
        }
      } catch (error) {
        const { diagnosePlaywrightFailure } = await import(
          "../src/modules/publishing/naver/playwright/playwright-failure-diagnosis"
        );
        const diagnosis = diagnosePlaywrightFailure("production-naver", error);
        console.error(formatFailureDiagnosis(diagnosis));
        naverStep = { success: false, diagnosis };
      } finally {
        await naverAutomationEngine.shutdown().catch(() => undefined);
      }
    }

    const success =
      workflowSuccess &&
      publishPackageCreated &&
      (browserMode === "mock" || Boolean(naverStep.success));

    console.log(
      JSON.stringify(
        {
          status: success ? "SUCCESS" : "FAILED",
          durationMs: Date.now() - startedAt,
          mock: browserMode === "mock",
          workflow: {
            status: result.status,
            publishPackageCreated,
            failedEngine: result.failedEngine ?? null,
          },
          naver: naverStep,
          debugArtifacts: [
            "debug/trace.zip",
            "debug/page.html",
            "debug/page.png",
            "debug/network.json",
            "debug/console.log",
          ],
        },
        null,
        2,
      ),
    );

    process.exit(success ? 0 : 1);
  } catch (error) {
    const { diagnosePlaywrightFailure, formatFailureDiagnosis: formatDiag } = await import(
      "../src/modules/publishing/naver/playwright/playwright-failure-diagnosis"
    );
    console.error(formatDiag(diagnosePlaywrightFailure("production-ready", error)));

    console.log(
      JSON.stringify({
        status: "FAILED",
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  }
}

main();
