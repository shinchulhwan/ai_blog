import { scheduleService } from "@/modules/scheduler";
import { calculateNextScheduledAt } from "@/modules/scheduler/utils/recurrence.util";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export interface SchedulerEngineOutput {
  scheduleId?: string;
  scheduleRunId?: string;
}

export class SchedulerEngine extends BaseEngine<SchedulerEngineOutput> {
  readonly id = "scheduler" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    if (!context.workflow.scheduleId) {
      return true;
    }

    return Boolean(context.state.historyId) && Boolean(context.workflow.jobId);
  }

  async execute(
    _input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<SchedulerEngineOutput> {
    const { scheduleId, scheduleRunId, jobId } = context.workflow;
    const historyId = context.state.historyId!;

    if (!scheduleId || !jobId) {
      return {};
    }

    const schedule = await scheduleService.requireById(scheduleId);
    const nextScheduledAt = calculateNextScheduledAt(schedule, new Date());

    if (scheduleRunId) {
      await scheduleService.completeRun(scheduleRunId, { jobId, historyId });

      this.registerRollback(context, async () => {
        await scheduleService.failRun(scheduleRunId, "Core Engine rollback");
      });
    }

    await scheduleService.markAfterRun(scheduleId, {
      lastJobId: jobId,
      lastHistoryId: historyId,
      nextScheduledAt,
    });

    context.state.scheduleCompleted = true;
    return { scheduleId, scheduleRunId };
  }
}

export const schedulerEngine = new SchedulerEngine();
