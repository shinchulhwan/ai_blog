import { getOpenAIClient } from "@/lib/openai/client";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import { getKoreanErrorMessage } from "@/lib/errors";
import { scheduleService } from "@/modules/scheduler/services/schedule.service";
import "../register-workflows";
import { workflowEngine } from "../engine/workflow-engine";
import { jobService } from "./job.service";
import type { JobProgressUpdate } from "@/types/job";
import type { AutoPublishWorkflowResult } from "../workflows/auto-publish.steps";

export interface JobRunResult {
  jobId: string;
  historyId: string;
  researchId: string;
  result: BlogFullResponse;
}

async function resolveScheduleRunId(scheduleId: string): Promise<string | undefined> {
  const runs = await scheduleService.listRuns(scheduleId, 5);
  return runs.find((run) => run.status === "RUNNING")?.id;
}

export async function runGenerationJob(jobId: string): Promise<JobRunResult> {
  const job = await jobService.getById(jobId);

  if (!job) {
    throw new Error("생성 작업을 찾을 수 없습니다.");
  }

  if (job.status === "COMPLETED") {
    throw new Error("이미 완료된 작업입니다.");
  }

  await jobService.markStarted(jobId);

  const onProgress = async (update: JobProgressUpdate) => {
    await jobService.updateProgress(jobId, {
      status: update.status,
      progress: update.progress,
      currentStepLabel: update.stepLabel ?? null,
    });
  };

  try {
    const client = getOpenAIClient();

    let customPrompt: string | undefined;
    let scheduleRunId: string | undefined;

    if (job.scheduleId) {
      const schedule = await scheduleService.getById(job.scheduleId);
      customPrompt = schedule?.prompt?.trim() || undefined;
      scheduleRunId = await resolveScheduleRunId(job.scheduleId);
    }

    const workflowResult = await workflowEngine.run<void, AutoPublishWorkflowResult>(
      "auto-publish",
      undefined,
      {
        keyword: job.keyword,
        client,
        projectId: job.projectId,
        jobId,
        scheduleId: job.scheduleId ?? undefined,
        scheduleRunId,
        customPrompt,
        onProgress,
      },
    );

    await jobService.markCompleted(
      jobId,
      workflowResult.historyId,
      workflowResult.researchId,
    );

    return {
      jobId,
      historyId: workflowResult.historyId,
      researchId: workflowResult.researchId,
      result: workflowResult.result,
    };
  } catch (error) {
    const message = getKoreanErrorMessage(error);
    await jobService.markFailed(jobId, message);
    throw new Error(message);
  }
}
