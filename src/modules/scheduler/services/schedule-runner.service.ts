import { getKoreanErrorMessage } from "@/lib/errors";
import { runGenerationJob } from "@/modules/workflow/services/job-runner.service";
import { jobService } from "@/modules/workflow/services/job.service";
import type { ScheduleExecuteResult, ScheduleRecord } from "@/types/schedule";
import { scheduleService } from "./schedule.service";

export interface ScheduleTickResult {
  processed: number;
  results: ScheduleExecuteResult[];
  errors: { scheduleId: string; error: string }[];
}

export async function executeScheduleById(
  scheduleId: string,
): Promise<ScheduleExecuteResult> {
  const schedule = await scheduleService.requireById(scheduleId);

  if (schedule.status !== "ACTIVE") {
    throw new Error("활성 상태의 예약만 실행할 수 있습니다.");
  }

  return executeSchedule(schedule);
}

export async function executeDueSchedules(): Promise<ScheduleTickResult> {
  const dueSchedules = await scheduleService.findDue();
  const results: ScheduleExecuteResult[] = [];
  const errors: { scheduleId: string; error: string }[] = [];

  for (const schedule of dueSchedules) {
    try {
      const result = await executeSchedule(schedule);
      results.push(result);
    } catch (error) {
      errors.push({
        scheduleId: schedule.id,
        error: getKoreanErrorMessage(error),
      });
    }
  }

  return {
    processed: results.length + errors.length,
    results,
    errors,
  };
}

async function executeSchedule(schedule: ScheduleRecord): Promise<ScheduleExecuteResult> {
  const acquired = await scheduleService.markProcessing(schedule.id);

  if (!acquired) {
    throw new Error("예약을 실행할 수 없습니다.");
  }

  const run = await scheduleService.createRun(schedule.id);

  try {
    const job = await jobService.create(schedule.keyword, {
      projectId: schedule.projectId,
      scheduleId: schedule.id,
    });

    const workflowResult = await runGenerationJob(job.id);

    return {
      scheduleId: schedule.id,
      runId: run.id,
      jobId: workflowResult.jobId,
      historyId: workflowResult.historyId,
    };
  } catch (error) {
    const message = getKoreanErrorMessage(error);

    await scheduleService.failRun(run.id, message);
    await scheduleService.resetProcessing(schedule.id, message);

    throw new Error(message);
  }
}
