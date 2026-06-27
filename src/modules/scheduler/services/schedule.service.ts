import type {
  Schedule,
  ScheduleRun,
  ScheduleRecurrence as PrismaScheduleRecurrence,
  ScheduleRunStatus as PrismaScheduleRunStatus,
  ScheduleStatus as PrismaScheduleStatus,
} from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { normalizeServiceError } from "@/lib/errors/normalize-error";
import { projectService } from "@/modules/project/services/project.service";
import type {
  CreateScheduleInput,
  ScheduleFilter,
  ScheduleRecord,
  ScheduleRunRecord,
  UpdateScheduleInput,
} from "@/types/schedule";
import { calculateNextScheduledAt } from "../utils/recurrence.util";
import {
  ScheduleInvalidStateError,
  ScheduleNotFoundError,
} from "../errors/schedule.errors";

function toScheduleRecord(record: Schedule): ScheduleRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    title: record.title,
    keyword: record.keyword,
    prompt: record.prompt,
    scheduledAt: record.scheduledAt.toISOString(),
    recurrence: record.recurrence as ScheduleRecord["recurrence"],
    customIntervalMinutes: record.customIntervalMinutes,
    status: record.status as ScheduleRecord["status"],
    lastRunAt: record.lastRunAt?.toISOString() ?? null,
    lastJobId: record.lastJobId,
    lastHistoryId: record.lastHistoryId,
    lastError: record.lastError,
    runCount: record.runCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toScheduleRunRecord(record: ScheduleRun): ScheduleRunRecord {
  return {
    id: record.id,
    scheduleId: record.scheduleId,
    jobId: record.jobId,
    historyId: record.historyId,
    status: record.status as ScheduleRunRecord["status"],
    startedAt: record.startedAt.toISOString(),
    finishedAt: record.finishedAt?.toISOString() ?? null,
    errorMessage: record.errorMessage,
  };
}

export class ScheduleService {
  async create(input: CreateScheduleInput): Promise<ScheduleRecord> {
    try {
      await projectService.requireActive(input.projectId);

      const record = await prisma.schedule.create({
        data: {
          projectId: input.projectId,
          title: input.title.trim(),
          keyword: input.keyword.trim(),
          prompt: input.prompt?.trim() ?? "",
          scheduledAt: new Date(input.scheduledAt),
          recurrence: (input.recurrence ?? "ONCE") as PrismaScheduleRecurrence,
          customIntervalMinutes: input.customIntervalMinutes ?? null,
          status: "ACTIVE",
        },
      });

      return toScheduleRecord(record);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async list(filter: ScheduleFilter = {}): Promise<ScheduleRecord[]> {
    const keyword = filter.keyword?.trim();

    const records = await prisma.schedule.findMany({
      where: {
        ...(filter.projectId && { projectId: filter.projectId }),
        ...(filter.status && { status: filter.status as PrismaScheduleStatus }),
        ...(keyword && {
          OR: [{ keyword: { contains: keyword } }, { title: { contains: keyword } }],
        }),
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return records.map(toScheduleRecord);
  }

  async getById(id: string): Promise<ScheduleRecord | null> {
    const record = await prisma.schedule.findUnique({ where: { id } });
    return record ? toScheduleRecord(record) : null;
  }

  async requireById(id: string): Promise<ScheduleRecord> {
    const record = await this.getById(id);

    if (!record) {
      throw new ScheduleNotFoundError(id);
    }

    return record;
  }

  async update(id: string, input: UpdateScheduleInput): Promise<ScheduleRecord> {
    await this.requireById(id);

    try {
      const record = await prisma.schedule.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title.trim() }),
          ...(input.keyword !== undefined && { keyword: input.keyword.trim() }),
          ...(input.prompt !== undefined && { prompt: input.prompt.trim() }),
          ...(input.scheduledAt !== undefined && {
            scheduledAt: new Date(input.scheduledAt),
          }),
          ...(input.recurrence !== undefined && {
            recurrence: input.recurrence as PrismaScheduleRecurrence,
          }),
          ...(input.customIntervalMinutes !== undefined && {
            customIntervalMinutes: input.customIntervalMinutes,
          }),
        },
      });

      return toScheduleRecord(record);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async delete(id: string): Promise<void> {
    await this.requireById(id);

    try {
      await prisma.schedule.delete({ where: { id } });
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async pause(id: string): Promise<ScheduleRecord> {
    const existing = await this.requireById(id);

    if (existing.status === "PAUSED") {
      return existing;
    }

    if (existing.status === "PROCESSING") {
      throw new ScheduleInvalidStateError("실행 중인 예약은 일시정지할 수 없습니다.");
    }

    if (existing.status === "COMPLETED") {
      throw new ScheduleInvalidStateError("완료된 예약은 일시정지할 수 없습니다.");
    }

    const record = await prisma.schedule.update({
      where: { id },
      data: { status: "PAUSED" as PrismaScheduleStatus },
    });

    return toScheduleRecord(record);
  }

  async resume(id: string): Promise<ScheduleRecord> {
    const existing = await this.requireById(id);

    if (existing.status === "ACTIVE") {
      return existing;
    }

    if (existing.status === "PROCESSING") {
      throw new ScheduleInvalidStateError("실행 중인 예약은 재개할 수 없습니다.");
    }

    if (existing.status === "COMPLETED") {
      throw new ScheduleInvalidStateError("완료된 예약은 재개할 수 없습니다.");
    }

    const record = await prisma.schedule.update({
      where: { id },
      data: {
        status: "ACTIVE" as PrismaScheduleStatus,
        lastError: null,
      },
    });

    return toScheduleRecord(record);
  }

  async findDue(now: Date = new Date()): Promise<ScheduleRecord[]> {
    const records = await prisma.schedule.findMany({
      where: {
        status: "ACTIVE",
        scheduledAt: { lte: now },
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    });

    return records.map(toScheduleRecord);
  }

  async markProcessing(id: string): Promise<boolean> {
    const result = await prisma.schedule.updateMany({
      where: { id, status: "ACTIVE" },
      data: { status: "PROCESSING" as PrismaScheduleStatus },
    });

    return result.count > 0;
  }

  async markAfterRun(
    id: string,
    input: {
      lastJobId: string;
      lastHistoryId: string;
      nextScheduledAt: Date | null;
      failed?: boolean;
      errorMessage?: string;
    },
  ): Promise<ScheduleRecord> {
    const status: PrismaScheduleStatus = input.failed
      ? input.nextScheduledAt
        ? "ACTIVE"
        : "FAILED"
      : input.nextScheduledAt
        ? "ACTIVE"
        : "COMPLETED";

    const record = await prisma.schedule.update({
      where: { id },
      data: {
        status,
        lastRunAt: new Date(),
        lastJobId: input.lastJobId,
        lastHistoryId: input.lastHistoryId,
        lastError: input.errorMessage ?? null,
        scheduledAt: input.nextScheduledAt ?? undefined,
        runCount: { increment: 1 },
      },
    });

    return toScheduleRecord(record);
  }

  async resetProcessing(id: string, errorMessage: string): Promise<ScheduleRecord> {
    const existing = await this.requireById(id);

    if (existing.recurrence === "ONCE") {
      const record = await prisma.schedule.update({
        where: { id },
        data: {
          status: "FAILED" as PrismaScheduleStatus,
          lastError: errorMessage,
        },
      });

      return toScheduleRecord(record);
    }

    const nextScheduledAt = calculateNextScheduledAt(existing, new Date());

    const record = await prisma.schedule.update({
      where: { id },
      data: {
        status: "ACTIVE" as PrismaScheduleStatus,
        lastError: errorMessage,
        ...(nextScheduledAt && { scheduledAt: nextScheduledAt }),
      },
    });

    return toScheduleRecord(record);
  }

  async createRun(scheduleId: string): Promise<ScheduleRunRecord> {
    const run = await prisma.scheduleRun.create({
      data: {
        scheduleId,
        status: "RUNNING",
      },
    });

    return toScheduleRunRecord(run);
  }

  async completeRun(
    runId: string,
    input: { jobId: string; historyId: string },
  ): Promise<ScheduleRunRecord> {
    const run = await prisma.scheduleRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED" as PrismaScheduleRunStatus,
        jobId: input.jobId,
        historyId: input.historyId,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    return toScheduleRunRecord(run);
  }

  async failRun(runId: string, errorMessage: string): Promise<ScheduleRunRecord> {
    const run = await prisma.scheduleRun.update({
      where: { id: runId },
      data: {
        status: "FAILED" as PrismaScheduleRunStatus,
        finishedAt: new Date(),
        errorMessage,
      },
    });

    return toScheduleRunRecord(run);
  }

  async listRuns(scheduleId: string, limit = 20): Promise<ScheduleRunRecord[]> {
    const runs = await prisma.scheduleRun.findMany({
      where: { scheduleId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return runs.map(toScheduleRunRecord);
  }
}

export const scheduleService = new ScheduleService();
