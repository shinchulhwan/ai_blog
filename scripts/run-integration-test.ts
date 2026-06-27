import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { getOpenAIClient } from "../src/lib/openai/client";
import { registerWorkflows } from "../src/modules/workflow/register-workflows";
import { workflowEngine } from "../src/modules/workflow/engine/workflow-engine";
import { integrationTestWorkflow } from "../src/modules/integration-test/workflows/integration-test.workflow";
import type { IntegrationTestWorkflowResult } from "../src/modules/integration-test/types/integration-test.types";

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
  process.env.OPENAI_API_KEY ??= "test-key";
  process.env.OPENAI_MODEL ??= "gpt-4o";
  process.env.NAVER_SESSION_SECRET ??= "integration-test-session-secret";
  process.env.NAVER_BROWSER_MODE = "mock";

  registerWorkflows();
  workflowEngine.register(integrationTestWorkflow);

  const result = await workflowEngine.run<void, IntegrationTestWorkflowResult>(
    "integration-test",
    undefined,
    {
      keyword: "integration-test",
      client: getOpenAIClient(),
      projectId: "integration-test-runner",
    },
  );

  console.log(JSON.stringify({
    status: result.status,
    total: result.total,
    passed: result.passed,
    failed: result.failed,
    logFile: result.logFile,
  }, null, 2));

  if (result.status !== "SUCCESS") {
    const failed = result.report.results.filter((item) => !item.passed);
    console.error("\nFailed tests:");
    for (const item of failed) {
      console.error(`- ${item.name}: ${item.errorMessage ?? "unknown error"}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
