import { prisma } from "@/shared/db/prisma";
import { blogHistoryService } from "@/modules/history";
import {
  coreEngineService,
  type CoreEngineContext,
  type CoreEngineInput,
  type EngineId,
} from "@/modules/core";
import { scheduleService } from "@/modules/scheduler";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import type { IntegrationTestCaseResult } from "../types/integration-test.types";
import { INTEGRATION_ENGINE_ORDER } from "../types/integration-test.types";
import {
  buildContextUpToEngine,
  runFullIntegrationPipeline,
} from "../helpers/pipeline-state.builder";
import type { IntegrationTestEnvironment } from "../helpers/integration-test-setup";

async function runCase(
  params: Omit<IntegrationTestCaseResult, "passed" | "durationMs"> & {
    run: () => Promise<void>;
  },
): Promise<IntegrationTestCaseResult> {
  const startedAt = Date.now();

  try {
    await params.run();
    return {
      id: params.id,
      category: params.category,
      engineId: params.engineId,
      method: params.method,
      scenarioId: params.scenarioId,
      name: params.name,
      passed: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      id: params.id,
      category: params.category,
      engineId: params.engineId,
      method: params.method,
      scenarioId: params.scenarioId,
      name: params.name,
      passed: false,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

function baseInput(env: IntegrationTestEnvironment): CoreEngineInput {
  return {
    keyword: env.keyword,
    jobId: env.jobId,
  };
}

async function ensureHistoryId(
  env: IntegrationTestEnvironment,
  workflow: WorkflowContext,
): Promise<string> {
  const result = await runFullIntegrationPipeline(workflow, baseInput(env), [
    "decision",
    "research",
    "writing",
    "quality",
    "image",
    "publishing",
  ]);

  if (!result.state.historyId) {
    throw new Error("scheduler 테스트용 historyId 생성에 실패했습니다.");
  }

  return result.state.historyId;
}

async function prepareSchedulerContext(
  env: IntegrationTestEnvironment,
  workflow: WorkflowContext,
  context: CoreEngineContext,
): Promise<void> {
  const scheduleRun = await scheduleService.createRun(env.scheduleId);
  workflow.scheduleId = env.scheduleId;
  workflow.scheduleRunId = scheduleRun.id;
  context.state.historyId = await ensureHistoryId(env, workflow);
}

async function testValidatePass(
  engineId: EngineId,
  env: IntegrationTestEnvironment,
): Promise<IntegrationTestCaseResult> {
  return runCase({
    id: `${engineId}-validate-pass`,
    category: "engine",
    engineId,
    method: "validate",
    name: `${engineId} validate() — 사전 조건 충족`,
    run: async () => {
      const workflow = env.createContext();
      const input = baseInput(env);
      const context = await buildContextUpToEngine(workflow, input, engineId);
      const engine = coreEngineService.getEngine(engineId);

      if (engineId === "scheduler") {
        await prepareSchedulerContext(env, workflow, context);
      }

      const valid = await engine.validate(input, context);

      if (!valid) {
        throw new Error("validate()가 true를 반환해야 합니다.");
      }
    },
  });
}

async function testValidateFail(
  engineId: EngineId,
  env: IntegrationTestEnvironment,
): Promise<IntegrationTestCaseResult> {
  return runCase({
    id: `${engineId}-validate-fail`,
    category: "engine",
    engineId,
    method: "validate",
    name: `${engineId} validate() — 사전 조건 미충족`,
    run: async () => {
      const workflow = env.createContext();
      const input = baseInput(env);
      const context: CoreEngineContext = { workflow, state: {}, rollbacks: [] };
      const engine = coreEngineService.getEngine(engineId);

      if (engineId === "decision" || engineId === "research") {
        input.keyword = "   ";
      } else if (engineId === "scheduler") {
        workflow.scheduleId = env.scheduleId;
      }

      const valid = await engine.validate(input, context);

      if (valid) {
        throw new Error("validate()가 false를 반환해야 합니다.");
      }
    },
  });
}

async function testExecute(
  engineId: EngineId,
  env: IntegrationTestEnvironment,
): Promise<IntegrationTestCaseResult> {
  return runCase({
    id: `${engineId}-execute`,
    category: "engine",
    engineId,
    method: "execute",
    name: `${engineId} execute() — 정상 실행`,
    run: async () => {
      const workflow = env.createContext();
      const input = baseInput(env);
      const context = await buildContextUpToEngine(workflow, input, engineId);
      const engine = coreEngineService.getEngine(engineId);

      if (engineId === "scheduler") {
        await prepareSchedulerContext(env, workflow, context);
      }

      const valid = await engine.validate(input, context);

      if (!valid) {
        throw new Error("execute() 전 validate()가 true여야 합니다.");
      }

      await engine.execute(input, context);
    },
  });
}

async function testRollback(
  engineId: EngineId,
  env: IntegrationTestEnvironment,
): Promise<IntegrationTestCaseResult> {
  return runCase({
    id: `${engineId}-rollback`,
    category: "engine",
    engineId,
    method: "rollback",
    name: `${engineId} rollback() — 롤백 처리`,
    run: async () => {
      const workflow = env.createContext();
      const input = baseInput(env);
      const context = await buildContextUpToEngine(workflow, input, engineId);
      const engine = coreEngineService.getEngine(engineId);

      if (engineId === "decision") {
        const researchEngine = coreEngineService.getEngine("research");
        await researchEngine.execute(input, context);
      } else if (engineId === "scheduler") {
        await prepareSchedulerContext(env, workflow, context);
        await engine.execute(input, context);
        const runId = workflow.scheduleRunId!;
        await engine.rollback(context);

        const run = await prisma.scheduleRun.findUnique({ where: { id: runId } });

        if (run?.status !== "FAILED") {
          throw new Error("scheduler rollback 후 ScheduleRun이 FAILED여야 합니다.");
        }

        return;
      } else {
        const valid = await engine.validate(input, context);

        if (!valid) {
          throw new Error("rollback 테스트 전 validate()가 true여야 합니다.");
        }

        await engine.execute(input, context);
      }

      const researchId = context.state.research?.id;
      const decisionId = context.state.decision?.id;
      const historyId = context.state.historyId;

      await engine.rollback(context);

      if (engineId === "research" && researchId) {
        const record = await prisma.research.findUnique({ where: { id: researchId } });

        if (record) {
          throw new Error("research rollback 후 레코드가 삭제되어야 합니다.");
        }
      }

      if (engineId === "decision" && decisionId) {
        const record = await prisma.decision.findUnique({ where: { id: decisionId } });

        if (record) {
          throw new Error("decision rollback 후 레코드가 삭제되어야 합니다.");
        }
      }

      if ((engineId === "history" || engineId === "publishing") && historyId) {
        const record = await blogHistoryService.getById(historyId);

        if (record) {
          throw new Error("history rollback 후 BlogHistory가 삭제되어야 합니다.");
        }
      }
    },
  });
}

export class EngineTestRunnerService {
  async runAll(env: IntegrationTestEnvironment): Promise<IntegrationTestCaseResult[]> {
    const results: IntegrationTestCaseResult[] = [];

    for (const engineId of INTEGRATION_ENGINE_ORDER) {
      results.push(await testValidatePass(engineId, env));
      results.push(await testValidateFail(engineId, env));
      results.push(await testExecute(engineId, env));
      results.push(await testRollback(engineId, env));
    }

    return results;
  }
}

export const engineTestRunnerService = new EngineTestRunnerService();
