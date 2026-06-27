import { prisma } from "@/shared/db/prisma";
import type {
  WorkflowRunRecord,
  WorkflowStepLogRecord,
  WorkflowRunStatus,
  WorkflowStepStatus,
} from "@/types/workflow-log";

interface WorkflowRunRow {
  id: string;
  jobId: string;
  workflowId: string;
  keyword: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  errorMessage: string | null;
}

interface WorkflowStepLogRow {
  id: string;
  runId: string;
  stepId: string;
  stepLabel: string;
  status: string;
  attempt: number;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
}

interface WorkflowRunWithSteps extends WorkflowRunRow {
  steps: WorkflowStepLogRow[];
}

type WorkflowDb = {
  workflowRun: {
    create: (args: {
      data: {
        jobId: string;
        workflowId: string;
        keyword: string;
        status: string;
      };
    }) => Promise<WorkflowRunRow>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<WorkflowRunRow>;
    findFirst: (args: {
      where: { jobId: string };
      orderBy: { startedAt: "desc" };
      include: { steps: { orderBy: { startedAt: "asc" } } };
    }) => Promise<WorkflowRunWithSteps | null>;
  };
  workflowStepLog: {
    create: (args: {
      data: {
        runId: string;
        stepId: string;
        stepLabel: string;
        attempt: number;
        status: string;
      };
    }) => Promise<WorkflowStepLogRow>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<WorkflowStepLogRow>;
  };
};

const db = prisma as unknown as WorkflowDb;

function toStepLogRecord(step: WorkflowStepLogRow): WorkflowStepLogRecord {
  return {
    id: step.id,
    runId: step.runId,
    stepId: step.stepId,
    stepLabel: step.stepLabel,
    status: step.status as WorkflowStepStatus,
    attempt: step.attempt,
    startedAt: step.startedAt.toISOString(),
    finishedAt: step.finishedAt?.toISOString() ?? null,
    durationMs: step.durationMs,
    errorMessage: step.errorMessage,
  };
}

function toRunRecord(run: WorkflowRunRow, steps?: WorkflowStepLogRow[]): WorkflowRunRecord {
  return {
    id: run.id,
    jobId: run.jobId,
    workflowId: run.workflowId,
    keyword: run.keyword,
    status: run.status as WorkflowRunStatus,
    startedAt: run.startedAt.toISOString(),
    finishedAt: run.finishedAt?.toISOString() ?? null,
    errorMessage: run.errorMessage,
    steps: steps?.map(toStepLogRecord),
  };
}

export class WorkflowLogService {
  async startRun(input: {
    projectId: string;
    jobId: string;
    workflowId: string;
    keyword: string;
  }): Promise<WorkflowRunRecord> {
    const run = await prisma.workflowRun.create({
      data: {
        projectId: input.projectId,
        jobId: input.jobId,
        workflowId: input.workflowId,
        keyword: input.keyword.trim(),
        status: "RUNNING",
      },
    });

    return toRunRecord(run);
  }

  async completeRun(runId: string): Promise<void> {
    await db.workflowRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  async failRun(runId: string, errorMessage: string): Promise<void> {
    await db.workflowRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage,
      },
    });
  }

  async startStep(input: {
    runId: string;
    stepId: string;
    stepLabel: string;
    attempt: number;
  }): Promise<WorkflowStepLogRecord> {
    const step = await db.workflowStepLog.create({
      data: {
        runId: input.runId,
        stepId: input.stepId,
        stepLabel: input.stepLabel,
        attempt: input.attempt,
        status: "RUNNING",
      },
    });

    return toStepLogRecord(step);
  }

  async completeStep(stepLogId: string, durationMs?: number): Promise<void> {
    await db.workflowStepLog.update({
      where: { id: stepLogId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        durationMs: durationMs ?? null,
        errorMessage: null,
      },
    });
  }

  async failStep(
    stepLogId: string,
    errorMessage: string,
    durationMs?: number,
  ): Promise<void> {
    await db.workflowStepLog.update({
      where: { id: stepLogId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        durationMs: durationMs ?? null,
        errorMessage,
      },
    });
  }

  async getByJobId(jobId: string): Promise<WorkflowRunRecord | null> {
    const run = await db.workflowRun.findFirst({
      where: { jobId },
      orderBy: { startedAt: "desc" },
      include: { steps: { orderBy: { startedAt: "asc" } } },
    });

    return run ? toRunRecord(run, run.steps) : null;
  }
}

export const workflowLogService = new WorkflowLogService();
