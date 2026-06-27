import type { GenerationJob, JobStatus as PrismaJobStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { projectService } from "@/modules/project/services/project.service";
import type {
  GenerationJobRecord,
  JobProgress,
  JobStatus,
} from "@/types/job";
import { VALID_JOB_PROGRESS } from "@/types/job";
import { normalizeServiceError } from "@/lib/errors/normalize-error";

function normalizeProgress(value: number): JobProgress {
  const matched = VALID_JOB_PROGRESS.find((step) => step === value);
  return matched ?? 0;
}

function toJobRecord(job: GenerationJob): GenerationJobRecord {
  const record = job as GenerationJob & {
    currentStepLabel?: string | null;
    retryCount?: number;
  };

  return {
    id: job.id,
    keyword: job.keyword,
    status: job.status as JobStatus,
    progress: normalizeProgress(job.progress),
    startedAt: job.startedAt?.toISOString() ?? null,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
    blogHistoryId: job.blogHistoryId,
    researchId: job.researchId,
    currentStepLabel: record.currentStepLabel ?? null,
    retryCount: record.retryCount ?? 0,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    imageJobId: job.imageJobId,
    naverUploadJobId: job.naverUploadJobId,
    scheduleId: job.scheduleId ?? null,
    projectId: job.projectId,
  };
}

export class JobService {
  async create(
    keyword: string,
    options: { projectId: string; scheduleId?: string },
  ): Promise<GenerationJobRecord> {
    await projectService.requireActive(options.projectId);

    const job = await prisma.generationJob.create({
      data: {
        keyword: keyword.trim(),
        projectId: options.projectId,
        status: "PENDING",
        progress: 0,
        scheduleId: options.scheduleId ?? null,
      },
    });

    return toJobRecord(job);
  }

  async getById(id: string): Promise<GenerationJobRecord | null> {
    const job = await prisma.generationJob.findUnique({ where: { id } });

    if (!job) {
      return null;
    }

    const record = toJobRecord(job);

    if (job.blogHistoryId && job.status === "COMPLETED") {
      const history = await prisma.blogHistory.findUnique({
        where: { id: job.blogHistoryId },
        select: { publishUrl: true },
      });

      return {
        ...record,
        publishUrl: history?.publishUrl ?? null,
      };
    }

    return {
      ...record,
      publishUrl: null,
    };
  }

  async updateProgress(
    id: string,
    input: {
      status?: JobStatus;
      progress?: JobProgress;
      startedAt?: Date;
      finishedAt?: Date;
      errorMessage?: string | null;
      blogHistoryId?: string | null;
      researchId?: string | null;
      currentStepLabel?: string | null;
      retryCount?: number;
    },
  ): Promise<GenerationJobRecord> {
    try {
      const job = await prisma.generationJob.update({
        where: { id },
        data: {
          ...(input.status && { status: input.status as PrismaJobStatus }),
          ...(input.progress !== undefined && { progress: input.progress }),
          ...(input.startedAt !== undefined && { startedAt: input.startedAt }),
          ...(input.finishedAt !== undefined && { finishedAt: input.finishedAt }),
          ...(input.errorMessage !== undefined && { errorMessage: input.errorMessage }),
          ...(input.blogHistoryId !== undefined && { blogHistoryId: input.blogHistoryId }),
          ...(input.researchId !== undefined && { researchId: input.researchId }),
          ...(input.currentStepLabel !== undefined && {
            currentStepLabel: input.currentStepLabel,
          }),
          ...(input.retryCount !== undefined && { retryCount: input.retryCount }),
        },
      });

      return toJobRecord(job);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async markStarted(id: string): Promise<GenerationJobRecord> {
    return this.updateProgress(id, {
      status: "GENERATING",
      progress: 0,
      startedAt: new Date(),
      errorMessage: null,
      currentStepLabel: "⚙️ 작업 준비 중...",
    });
  }

  async markFailed(id: string, errorMessage: string): Promise<GenerationJobRecord> {
    return this.updateProgress(id, {
      status: "FAILED",
      finishedAt: new Date(),
      errorMessage,
    });
  }

  async markCompleted(
    id: string,
    blogHistoryId: string,
    researchId?: string,
  ): Promise<GenerationJobRecord> {
    return this.updateProgress(id, {
      status: "COMPLETED",
      progress: 100,
      finishedAt: new Date(),
      blogHistoryId,
      researchId: researchId ?? null,
      errorMessage: null,
      currentStepLabel: "✅ 완료",
    });
  }
}

export const jobService = new JobService();
