import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
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

async function main() {
  process.env.IMAGE_PROVIDER ??= "mock";
  process.env.NAVER_SESSION_SECRET ??= "e2e-test-session-secret";
  process.env.NAVER_BROWSER_MODE = "mock";

  registerWorkflows();
  workflowEngine.register(e2eWorkflowTestWorkflow);

  const result = await workflowEngine.run("e2e-workflow-test", undefined, {
    keyword: "e2e-workflow-test",
    client: {} as never,
    projectId: "e2e-workflow-test-runner",
  });

  console.log(JSON.stringify({
    status: result.status,
    logFile: result.logFile,
    summary: result.summary,
    failedEngine: result.failedEngine,
    steps: result.report.steps.map((step) => ({
      stepId: step.stepId,
      name: step.name,
      passed: step.passed,
      durationMs: step.durationMs,
      retryCount: step.retryCount,
      errorMessage: step.errorMessage,
    })),
  }, null, 2));

  if (result.status !== "SUCCESS") {
    if (result.failedEngine) {
      console.error(`\nFailed Engine: ${result.failedEngine}`);
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
