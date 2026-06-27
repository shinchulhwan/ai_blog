import type { JobProgress, JobStatus } from "@/types/job";
import type { WorkflowContext } from "../types/workflow.types";
import { normalizeServiceError } from "@/lib/errors/normalize-error";
import { workflowLogService } from "../services/workflow-log.service";

export interface WorkflowStepConfig {
  id: string;
  label: string;
  progress: JobProgress;
  status?: JobStatus;
}

export const MAX_STEP_RETRIES = 3;

export async function runWorkflowStep<T>(
  context: WorkflowContext,
  step: WorkflowStepConfig,
  fn: () => Promise<T>,
): Promise<T> {
  if (context.onProgress) {
    await context.onProgress({
      status: step.status ?? "GENERATING",
      progress: step.progress,
      stepLabel: step.label,
    });
  }

  let lastError: Error = new Error("워크플로 단계 실행에 실패했습니다.");

  for (let attempt = 1; attempt <= MAX_STEP_RETRIES; attempt++) {
    let stepLogId: string | undefined;
    const startedAt = Date.now();

    if (context.workflowRunId) {
      const stepLog = await workflowLogService.startStep({
        runId: context.workflowRunId,
        stepId: step.id,
        stepLabel: step.label,
        attempt,
      });
      stepLogId = stepLog.id;
    }

    try {
      const result = await fn();
      const durationMs = Date.now() - startedAt;

      if (stepLogId) {
        await workflowLogService.completeStep(stepLogId, durationMs);
      }

      return result;
    } catch (error) {
      lastError = normalizeServiceError(error);
      const durationMs = Date.now() - startedAt;

      if (stepLogId) {
        await workflowLogService.failStep(stepLogId, lastError.message, durationMs);
      }

      if (attempt === MAX_STEP_RETRIES) {
        throw lastError;
      }
    }
  }

  throw lastError;
}
