import { DatabaseError } from "@/lib/errors";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { researchAiSchema } from "@/lib/schemas/research.schema";
import { blogHistoryService } from "@/modules/history";
import { coreEngineService } from "@/modules/core";
import { prisma } from "@/shared/db/prisma";
import {
  MAX_STEP_RETRIES,
  runWorkflowStep,
} from "@/modules/workflow/engine/run-workflow-step";
import { scheduleService } from "@/modules/scheduler";
import type { IntegrationTestCaseResult, WorkflowScenarioId } from "../types/integration-test.types";
import { INTEGRATION_FULL_PHASES } from "../types/integration-test.types";
import { runFullIntegrationPipeline } from "../helpers/pipeline-state.builder";
import { createMockOpenAIClient } from "../helpers/mock-openai-client";
import { buildResearchFixture } from "../fixtures/openai-fixtures";
import type { IntegrationTestEnvironment } from "../helpers/integration-test-setup";

async function runScenario(
  scenarioId: WorkflowScenarioId,
  name: string,
  env: IntegrationTestEnvironment,
  run: () => Promise<void>,
): Promise<IntegrationTestCaseResult> {
  const startedAt = Date.now();

  try {
    await run();
    return {
      id: `workflow-${scenarioId}`,
      category: "workflow",
      scenarioId,
      name,
      passed: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      id: `workflow-${scenarioId}`,
      category: "workflow",
      scenarioId,
      name,
      passed: false,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function baseInput(env: IntegrationTestEnvironment) {
  return {
    keyword: env.keyword,
    jobId: env.jobId,
  };
}

async function expectFailure(run: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await run();
    throw new Error(message);
  } catch (error) {
    if (error instanceof Error && error.message === message) {
      throw error;
    }
  }
}

export class WorkflowScenarioRunnerService {
  async runAll(env: IntegrationTestEnvironment): Promise<IntegrationTestCaseResult[]> {
    return [
      await this.testNormalExecution(env),
      await this.testOpenAiFailure(env),
      await this.testJsonParseFailure(env),
      await this.testDbSaveFailure(env),
      await this.testTimeout(env),
      await this.testRetry(env),
      await this.testRollback(env),
    ];
  }

  private async testNormalExecution(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "normal-execution",
      "Workflow — 정상 실행",
      env,
      async () => {
        const workflow = env.createContext();
        const scheduleRun = await scheduleService.createRun(env.scheduleId);
        workflow.scheduleRunId = scheduleRun.id;

        const result = await runFullIntegrationPipeline(
          workflow,
          baseInput(env),
          INTEGRATION_FULL_PHASES,
        );

        if (!result.state.publishPackage) {
          throw new Error("PublishPackage가 생성되어야 합니다.");
        }

        if (!result.state.historyId) {
          throw new Error("historyId가 설정되어야 합니다.");
        }

        if (result.enginesExecuted.length !== INTEGRATION_FULL_PHASES.length) {
          throw new Error("모든 Engine이 실행되어야 합니다.");
        }
      },
    );
  }

  private async testOpenAiFailure(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "openai-failure",
      "Workflow — OpenAI 실패",
      env,
      async () => {
        const workflow = env.createContext({ mode: "openai-failure" });

        await expectFailure(
          () => runFullIntegrationPipeline(workflow, baseInput(env), ["research"]),
          "OpenAI 실패 시 파이프라인이 중단되어야 합니다.",
        );
      },
    );
  }

  private async testJsonParseFailure(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "json-parse-failure",
      "Workflow — JSON Parse 실패",
      env,
      async () => {
        const client = createMockOpenAIClient({ mode: "json-parse-failure" });

        await expectFailure(
          () =>
            callStructuredJson(
              client,
              {
                instructions: "test",
                input: "test",
              },
              researchAiSchema,
              "keyword_research",
              2,
            ),
          "JSON Parse 실패 시 callStructuredJson이 throw해야 합니다.",
        );
      },
    );
  }

  private async testDbSaveFailure(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "db-save-failure",
      "Workflow — DB 저장 실패",
      env,
      async () => {
        const workflow = env.createContext();
        const original = blogHistoryService.saveFromBlogResult.bind(blogHistoryService);

        blogHistoryService.saveFromBlogResult = async () => {
          throw new DatabaseError("Integration test DB save failure");
        };

        try {
          await expectFailure(
            () =>
              runFullIntegrationPipeline(workflow, baseInput(env), [
                "decision",
                "research",
                "writing",
                "quality",
                "image",
                "publishing",
              ]),
            "DB 저장 실패 시 publishing 단계가 실패해야 합니다.",
          );
        } finally {
          blogHistoryService.saveFromBlogResult = original;
        }
      },
    );
  }

  private async testTimeout(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "timeout",
      "Workflow — Timeout",
      env,
      async () => {
        const client = createMockOpenAIClient({ mode: "timeout" });
        const timeoutMs = 300;

        await expectFailure(
          () =>
            Promise.race([
              callStructuredJson(
                client,
                {
                  instructions: "test",
                  input: "test",
                },
                researchAiSchema,
                "keyword_research",
                1,
              ),
              new Promise<never>((_, reject) => {
                setTimeout(() => {
                  reject(new Error("Integration test timeout"));
                }, timeoutMs);
              }),
            ]),
          "Timeout 시 요청이 중단되어야 합니다.",
        );
      },
    );
  }

  private async testRetry(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "retry",
      "Workflow — Retry",
      env,
      async () => {
        let attempts = 0;
        const workflow = env.createContext();

        await runWorkflowStep(workflow, {
          id: "integration-retry",
          label: "Retry 테스트",
          progress: 20,
        }, async () => {
          attempts += 1;

          if (attempts < MAX_STEP_RETRIES) {
            throw new Error(`Retry attempt ${attempts}`);
          }
        });

        if (attempts !== MAX_STEP_RETRIES) {
          throw new Error(`runWorkflowStep이 ${MAX_STEP_RETRIES}회 재시도해야 합니다.`);
        }

        const client = createMockOpenAIClient({ mode: "retry", failCount: 2 });
        const result = await callStructuredJson(
          client,
          {
            instructions: "test",
            input: "test",
          },
          researchAiSchema,
          "keyword_research",
          3,
        );

        if (!result.intent) {
          throw new Error("Retry 후 유효한 JSON이 반환되어야 합니다.");
        }

        void buildResearchFixture();
      },
    );
  }

  private async testRollback(
    env: IntegrationTestEnvironment,
  ): Promise<IntegrationTestCaseResult> {
    return runScenario(
      "rollback",
      "Workflow — Rollback",
      env,
      async () => {
        const workflow = env.createContext();
        const input = baseInput(env);
        const context = {
          workflow,
          state: {} as import("@/modules/core").CoreEngineState,
          rollbacks: [] as import("@/modules/core").EngineRollbackEntry[],
        };

        const researchEngine = coreEngineService.getEngine("research");
        const writingEngine = coreEngineService.getEngine("writing");

        await researchEngine.validate(input, context);
        await researchEngine.execute(input, context);

        const researchId = context.state.research?.id;

        if (!researchId) {
          throw new Error("research 레코드가 생성되어야 합니다.");
        }

        const failingWorkflow = env.createContext({ mode: "openai-failure" });
        context.workflow = failingWorkflow;

        try {
          await writingEngine.validate(input, context);
          await writingEngine.execute(input, context);
          throw new Error("writing Engine이 실패해야 rollback이 트리거됩니다.");
        } catch {
          await researchEngine.rollback(context);
        }

        const deleted = await prisma.research.findUnique({ where: { id: researchId } });

        if (deleted) {
          throw new Error("rollback 후 research 레코드가 삭제되어야 합니다.");
        }
      },
    );
  }
}

export const workflowScenarioRunnerService = new WorkflowScenarioRunnerService();
