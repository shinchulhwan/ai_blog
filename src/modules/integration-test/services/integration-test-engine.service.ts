import { engineTestRunnerService } from "./engine-test-runner.service";
import { integrationTestLogService } from "./integration-test-log.service";
import { workflowScenarioRunnerService } from "./workflow-scenario-runner.service";
import { createIntegrationTestEnvironment } from "../helpers/integration-test-setup";
import type {
  IntegrationTestReport,
  IntegrationTestWorkflowResult,
} from "../types/integration-test.types";
import { INTEGRATION_ENGINE_ORDER } from "../types/integration-test.types";

export class IntegrationTestEngineService {
  async runAll(): Promise<IntegrationTestWorkflowResult> {
    const startedAt = new Date();
    const env = await createIntegrationTestEnvironment();

    try {
      const engineResults = await engineTestRunnerService.runAll(env);
      const workflowResults = await workflowScenarioRunnerService.runAll(env);
      const results = [...engineResults, ...workflowResults];
      const passed = results.filter((result) => result.passed).length;
      const failed = results.length - passed;
      const finishedAt = new Date();

      const report: IntegrationTestReport = {
        status: failed === 0 ? "SUCCESS" : "FAILED",
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        total: results.length,
        passed,
        failed,
        engineOrder: INTEGRATION_ENGINE_ORDER,
        results,
      };

      const logFile = await integrationTestLogService.write(report);

      return {
        status: report.status,
        total: report.total,
        passed: report.passed,
        failed: report.failed,
        logFile,
        report,
      };
    } finally {
      await env.cleanup();
    }
  }
}

export const integrationTestEngineService = new IntegrationTestEngineService();
