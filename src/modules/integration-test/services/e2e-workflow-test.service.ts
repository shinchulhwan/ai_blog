import { coreEngineService, type CoreEngineContext, type CoreEngineInput, type CoreEngineState, type EngineId } from "@/modules/core";
import { keywordService } from "@/modules/keyword";
import { jobService } from "@/modules/workflow";
import type { KeywordRecord } from "@/types/keyword";
import type { GenerationJobRecord } from "@/types/job";
import { createE2eTestEnvironment } from "../helpers/e2e-test-setup";
import { E2eStepExecutionError, runE2eStep } from "../helpers/e2e-step-runner";
import { e2eWorkflowLogService } from "./e2e-workflow-log.service";
import type {
  E2eStepLog,
  E2eWorkflowReport,
  E2eWorkflowStatus,
  E2eWorkflowStepDefinition,
  E2eWorkflowStepId,
  E2eWorkflowSummary,
  E2eWorkflowTestResult,
} from "../types/e2e-workflow.types";
import { E2E_WORKFLOW_STEPS } from "../types/e2e-workflow.types";

function countGeneratedImages(state: CoreEngineState): number {
  if (!state.imageResult) {
    return 0;
  }

  let count = 0;

  if (state.imageResult.coverImageUrl) {
    count += 1;
  }

  count += state.imageResult.contentImageUrls.length;

  if (state.imageResult.thumbnailUrl) {
    count += 1;
  }

  return count;
}

function buildSummary(params: {
  status: E2eWorkflowStatus;
  totalDurationMs: number;
  state: CoreEngineState;
  failedStep: E2eWorkflowStepId | null;
  failedEngine: EngineId | null;
}): E2eWorkflowSummary {
  return {
    status: params.status,
    totalDurationMs: params.totalDurationMs,
    generatedTitle:
      params.state.titleData?.selectedTitle ??
      params.state.publishPackage?.title ??
      params.state.result?.selectedTitle ??
      null,
    imageCount: countGeneratedImages(params.state),
    historySaved: Boolean(params.state.historyId),
    publishPackageCreated: Boolean(params.state.publishPackage),
    failedStep: params.failedStep,
    failedEngine: params.failedEngine,
  };
}

export class E2eWorkflowTestService {
  async run(): Promise<E2eWorkflowTestResult> {
    process.env.IMAGE_PROVIDER ??= "mock";

    const startedAt = new Date();
    const env = await createE2eTestEnvironment();
    const steps: E2eStepLog[] = [];
    let keywordRecord: KeywordRecord | undefined;
    let job: GenerationJobRecord | undefined;
    let failedStep: E2eWorkflowStepId | null = null;
    let failedEngine: EngineId | null = null;

    const coreState: CoreEngineState = {};
    let workflow = env.createContext();
    let coreContext: CoreEngineContext = {
      workflow,
      state: coreState,
      rollbacks: [],
    };
    const coreInput: CoreEngineInput = {
      keyword: env.keyword,
    };

    try {
      for (const stepDef of E2E_WORKFLOW_STEPS) {
        const stepLog = await this.runStep(stepDef, {
          env,
          getKeywordRecord: () => keywordRecord,
          setKeywordRecord: (record) => {
            keywordRecord = record;
          },
          getJob: () => job,
          setJob: (record) => {
            job = record;
          },
          refreshWorkflow: (jobId) => {
            workflow = env.createContext(undefined, jobId);
            coreContext = {
              workflow,
              state: coreState,
              rollbacks: coreContext.rollbacks,
            };
            coreInput.jobId = jobId;
          },
          coreContext,
          coreInput,
        });

        steps.push(stepLog);
      }

      const finishedAt = new Date();
      const summary = buildSummary({
        status: "SUCCESS",
        totalDurationMs: finishedAt.getTime() - startedAt.getTime(),
        state: coreState,
        failedStep: null,
        failedEngine: null,
      });

      const report: E2eWorkflowReport = {
        status: "SUCCESS",
        keyword: env.keyword,
        projectId: env.projectId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        summary,
        steps,
      };

      const logFile = await e2eWorkflowLogService.write(report);

      return {
        status: "SUCCESS",
        logFile,
        summary,
        report,
        failedEngine: null,
      };
    } catch (error) {
      const finishedAt = new Date();

      if (error instanceof E2eStepExecutionError) {
        steps.push(error.stepLog);
        failedStep = error.stepLog.stepId;
        failedEngine = error.stepLog.engineId;
      }

      const summary = buildSummary({
        status: "FAILED",
        totalDurationMs: finishedAt.getTime() - startedAt.getTime(),
        state: coreState,
        failedStep,
        failedEngine,
      });

      const report: E2eWorkflowReport = {
        status: "FAILED",
        keyword: env.keyword,
        projectId: env.projectId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        summary,
        steps,
      };

      const logFile = await e2eWorkflowLogService.write(report);

      return {
        status: "FAILED",
        logFile,
        summary,
        report,
        failedEngine,
      };
    } finally {
      await env.cleanup();
    }
  }

  private async runStep(
    stepDef: E2eWorkflowStepDefinition,
    ctx: {
      env: Awaited<ReturnType<typeof createE2eTestEnvironment>>;
      getKeywordRecord: () => KeywordRecord | undefined;
      setKeywordRecord: (record: KeywordRecord) => void;
      getJob: () => GenerationJobRecord | undefined;
      setJob: (record: GenerationJobRecord) => void;
      refreshWorkflow: (jobId: string) => void;
      coreContext: CoreEngineContext;
      coreInput: CoreEngineInput;
    },
  ): Promise<E2eStepLog> {
    return runE2eStep({
      stepId: stepDef.id,
      name: stepDef.name,
      engineId: stepDef.engineId,
      fn: async () => {
        switch (stepDef.id) {
          case "keyword-input": {
            const record = await keywordService.ensureSaved(ctx.env.keyword, {
              projectId: ctx.env.projectId,
            });
            ctx.setKeywordRecord(record);
            return;
          }

          case "workflow-start": {
            const record = await jobService.create(ctx.env.keyword, {
              projectId: ctx.env.projectId,
            });
            ctx.setJob(record);
            ctx.refreshWorkflow(record.id);
            return;
          }

          case "workflow-complete": {
            const keywordRecord = ctx.getKeywordRecord();

            if (!keywordRecord?.id) {
              throw new Error("키워드 레코드를 찾을 수 없습니다.");
            }

            await keywordService.markGenerationCompleted(keywordRecord.id);
            return;
          }

          default: {
            const engineId = stepDef.engineId;

            if (!engineId) {
              throw new Error(`${stepDef.id} 단계 Engine ID가 없습니다.`);
            }

            const engine = coreEngineService.getEngine(engineId);
            const valid = await engine.validate(ctx.coreInput, ctx.coreContext);

            if (!valid) {
              throw new Error(`${engineId} Engine 사전 조건을 충족하지 못했습니다.`);
            }

            await engine.execute(ctx.coreInput, ctx.coreContext);
          }
        }
      },
    });
  }
}

export const e2eWorkflowTestService = new E2eWorkflowTestService();
