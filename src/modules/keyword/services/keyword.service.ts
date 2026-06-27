import type { Keyword, KeywordStatus as PrismaKeywordStatus } from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { projectService } from "@/modules/project/services/project.service";
import type {
  CreateKeywordInput,
  KeywordListFilters,
  KeywordRecord,
  KeywordStatus,
  UpdateKeywordInput,
} from "@/types/keyword";

function toKeywordRecord(keyword: Keyword): KeywordRecord {
  return {
    id: keyword.id,
    projectId: keyword.projectId,
    keyword: keyword.keyword,
    category: keyword.category,
    status: keyword.status as KeywordStatus,
    createdAt: keyword.createdAt.toISOString(),
    updatedAt: keyword.updatedAt.toISOString(),
    lastGeneratedAt: keyword.lastGeneratedAt?.toISOString() ?? null,
    scheduledAt: keyword.scheduledAt?.toISOString() ?? null,
    priority: keyword.priority,
    retryCount: keyword.retryCount,
    lastError: keyword.lastError,
  };
}

export class KeywordService {
  async findAll(filters: KeywordListFilters = {}): Promise<KeywordRecord[]> {
    const keywords = await prisma.keyword.findMany({
      where: {
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.status && { status: filters.status as PrismaKeywordStatus }),
        ...(filters.category && { category: filters.category }),
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return keywords.map(toKeywordRecord);
  }

  async findById(id: string): Promise<KeywordRecord | null> {
    const keyword = await prisma.keyword.findUnique({ where: { id } });
    return keyword ? toKeywordRecord(keyword) : null;
  }

  async create(input: CreateKeywordInput): Promise<KeywordRecord> {
    const projectId = await projectService.resolveProjectId(input.projectId);

    const keyword = await prisma.keyword.create({
      data: {
        projectId,
        keyword: input.keyword.trim(),
        category: input.category.trim(),
        status: (input.status ?? "PENDING") as PrismaKeywordStatus,
      },
    });

    return toKeywordRecord(keyword);
  }

  async update(id: string, input: UpdateKeywordInput): Promise<KeywordRecord> {
    const keyword = await prisma.keyword.update({
      where: { id },
      data: {
        ...(input.keyword !== undefined && { keyword: input.keyword.trim() }),
        ...(input.category !== undefined && { category: input.category.trim() }),
        ...(input.status !== undefined && {
          status: input.status as PrismaKeywordStatus,
        }),
      },
    });

    return toKeywordRecord(keyword);
  }

  async delete(id: string): Promise<void> {
    await prisma.keyword.delete({ where: { id } });
  }

  async findDueForGeneration(now = new Date()): Promise<KeywordRecord[]> {
    const keywords = await prisma.keyword.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: now },
      },
      orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    });

    return keywords.map(toKeywordRecord);
  }

  async ensureSaved(
    keyword: string,
    options: { projectId: string; category?: string },
  ): Promise<KeywordRecord> {
    const trimmed = keyword.trim();
    const existing = await prisma.keyword.findFirst({
      where: { projectId: options.projectId, keyword: trimmed },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return toKeywordRecord(existing);
    }

    return this.create({
      projectId: options.projectId,
      keyword: trimmed,
      category: options.category ?? "일반",
    });
  }

  async markGenerationCompleted(id: string): Promise<KeywordRecord> {
    const keyword = await prisma.keyword.update({
      where: { id },
      data: {
        status: "COMPLETED",
        lastGeneratedAt: new Date(),
        lastError: null,
      },
    });

    return toKeywordRecord(keyword);
  }

  async markGenerationFailed(id: string, error: string): Promise<KeywordRecord> {
    const keyword = await prisma.keyword.update({
      where: { id },
      data: {
        status: "FAILED",
        lastError: error,
        retryCount: { increment: 1 },
      },
    });

    return toKeywordRecord(keyword);
  }
}

export const keywordService = new KeywordService();
