import { getKoreanErrorMessage } from "@/lib/errors";
import { MAX_STEP_RETRIES } from "@/modules/workflow/engine/run-workflow-step";
import type { EngineId } from "@/modules/core";
import type { E2eStepLog, E2eWorkflowStepId } from "../types/e2e-workflow.types";

export class E2eStepExecutionError extends Error {
  constructor(
    message: string,
    readonly stepLog: E2eStepLog,
  ) {
    super(message);
    this.name = "E2eStepExecutionError";
  }
}

export async function runE2eStep(params: {
  stepId: E2eWorkflowStepId;
  name: string;
  engineId: EngineId | null;
  fn: () => Promise<void>;
  maxRetries?: number;
}): Promise<E2eStepLog> {
  const maxRetries = params.maxRetries ?? MAX_STEP_RETRIES;
  const startedAt = new Date();
  let retryCount = 0;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const attemptStartedAt = Date.now();

    try {
      await params.fn();
      const finishedAt = new Date();

      return {
        stepId: params.stepId,
        name: params.name,
        engineId: params.engineId,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        retryCount: attempt - 1,
        passed: true,
      };
    } catch (error) {
      lastError = getKoreanErrorMessage(error);
      retryCount = attempt;

      if (attempt === maxRetries) {
        const finishedAt = new Date();
        const stepLog: E2eStepLog = {
          stepId: params.stepId,
          name: params.name,
          engineId: params.engineId,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          retryCount: maxRetries - 1,
          passed: false,
          errorMessage: lastError,
        };

        throw new E2eStepExecutionError(lastError, stepLog);
      }

      void attemptStartedAt;
    }
  }

  const finishedAt = new Date();
  throw new E2eStepExecutionError(lastError ?? "E2E step failed", {
    stepId: params.stepId,
    name: params.name,
    engineId: params.engineId,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    retryCount,
    passed: false,
    errorMessage: lastError,
  });
}
