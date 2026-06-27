import type {
  BlogHistory,
  BlogHistoryStatus as PrismaBlogHistoryStatus,
} from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type {
  BlogHistoryFilter,
  BlogHistoryListItem,
  BlogHistoryRecord,
  FaqItem,
  HistoryImageAssets,
} from "@/types/history";
import { generateKoreanSeoBlog } from "@/modules/writer";
import { getOpenAIClient } from "@/lib/openai/client";

function parseJsonArray<T>(value: string, fallback: T[]): T[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function parseImageAssets(value: string | null): HistoryImageAssets | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as HistoryImageAssets;
  } catch {
    return null;
  }
}

function toBlogHistoryRecord(record: BlogHistory): BlogHistoryRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    keyword: record.keyword,
    selectedTitle: record.selectedTitle,
    content: record.content,
    metaDescription: record.metaDescription,
    hashtags: parseJsonArray<string>(record.hashtags, []),
    faq: parseJsonArray<FaqItem>(record.faq, []),
    imagePrompt: record.imagePrompt,
    imageAssets: parseImageAssets(record.imageAssets ?? null),
    seoScore: record.seoScore,
    status: record.status as BlogHistoryRecord["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    publishedAt: record.publishedAt?.toISOString() ?? null,
    naverPostId: record.naverPostId,
    publishUrl: record.publishUrl,
    publishError: record.publishError,
  };
}

type BlogHistoryListRow = Pick<
  BlogHistory,
  | "id"
  | "projectId"
  | "keyword"
  | "selectedTitle"
  | "metaDescription"
  | "seoScore"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

function toBlogHistoryListItem(record: BlogHistoryListRow): BlogHistoryListItem {
  return {
    id: record.id,
    projectId: record.projectId,
    keyword: record.keyword,
    selectedTitle: record.selectedTitle,
    metaDescription: record.metaDescription,
    seoScore: record.seoScore,
    status: record.status as BlogHistoryListItem["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapBlogImagesToHistoryAssets(
  blog: BlogFullResponse & {
    coverImageUrl?: string | null;
    contentImageUrls?: string[];
    thumbnailUrl?: string | null;
  },
): HistoryImageAssets {
  return {
    representativeImagePrompt: blog.representativeImagePrompt,
    bodyImagePrompts: blog.bodyImagePrompts,
    thumbnailText: blog.thumbnailText,
    altTags: blog.altTags,
    imageFilenames: blog.imageFilenames,
    coverImageUrl: blog.coverImageUrl ?? null,
    contentImageUrls: blog.contentImageUrls ?? [],
    thumbnailUrl: blog.thumbnailUrl ?? null,
  };
}

export class BlogHistoryService {
  async saveFromBlogResult(
    keyword: string,
    blog: BlogFullResponse,
    status: PrismaBlogHistoryStatus = "READY",
    projectId: string,
  ): Promise<BlogHistoryRecord> {
    const record = await prisma.blogHistory.create({
      data: {
        projectId,
        keyword: keyword.trim(),
        selectedTitle: blog.selectedTitle,
        content: blog.content,
        metaDescription: blog.metaDescription,
        hashtags: JSON.stringify(blog.hashtags),
        faq: JSON.stringify(blog.faq),
        imagePrompt: blog.representativeImagePrompt,
        imageAssets: JSON.stringify(mapBlogImagesToHistoryAssets(blog)),
        seoScore: blog.seoScore,
        status,
      },
    });

    return toBlogHistoryRecord(record);
  }

  async list(filter: BlogHistoryFilter = {}): Promise<BlogHistoryListItem[]> {
    const search = filter.search?.trim();

    const records = await prisma.blogHistory.findMany({
      where: {
        ...(filter.projectId && { projectId: filter.projectId }),
        ...(filter.status && { status: filter.status as PrismaBlogHistoryStatus }),
        ...(search && {
          OR: [
            { keyword: { contains: search } },
            { selectedTitle: { contains: search } },
            { metaDescription: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
      select: {
        id: true,
        projectId: true,
        keyword: true,
        selectedTitle: true,
        metaDescription: true,
        seoScore: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return records.map(toBlogHistoryListItem);
  }

  async getById(id: string): Promise<BlogHistoryRecord | null> {
    const record = await prisma.blogHistory.findUnique({ where: { id } });
    return record ? toBlogHistoryRecord(record) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.blogHistory.delete({ where: { id } });
  }

  async regenerate(id: string): Promise<BlogHistoryRecord> {
    const existing = await this.getById(id);

    if (!existing) {
      throw new Error("생성 이력을 찾을 수 없습니다.");
    }

    const client = getOpenAIClient();
    const { result } = await generateKoreanSeoBlog(client, existing.keyword, {
      projectId: existing.projectId,
    });
    return this.saveFromBlogResult(existing.keyword, result, "CREATED", existing.projectId);
  }

  async markReady(id: string): Promise<BlogHistoryRecord> {
    const record = await prisma.blogHistory.update({
      where: { id },
      data: {
        status: "READY" as PrismaBlogHistoryStatus,
        publishError: null,
      },
    });

    return toBlogHistoryRecord(record);
  }

  async markPublishing(id: string): Promise<BlogHistoryRecord> {
    const record = await prisma.blogHistory.update({
      where: { id },
      data: {
        status: "PUBLISHING" as PrismaBlogHistoryStatus,
        publishError: null,
      },
    });

    return toBlogHistoryRecord(record);
  }

  async markPublished(
    id: string,
    input: { naverPostId: string; publishUrl: string },
  ): Promise<BlogHistoryRecord> {
    const record = await prisma.blogHistory.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        naverPostId: input.naverPostId,
        publishUrl: input.publishUrl,
        publishError: null,
      },
    });

    return toBlogHistoryRecord(record);
  }

  async markPublishFailed(
    id: string,
    error:
      | string
      | {
          errorCode: string;
          errorMessage: string;
          retryCount?: number;
        },
  ): Promise<BlogHistoryRecord> {
    const publishError =
      typeof error === "string"
        ? error
        : JSON.stringify({
            errorCode: error.errorCode,
            errorMessage: error.errorMessage,
            retryCount: error.retryCount ?? 0,
          });

    const record = await prisma.blogHistory.update({
      where: { id },
      data: {
        status: "FAILED",
        publishError,
      },
    });

    return toBlogHistoryRecord(record);
  }
}

export const blogHistoryService = new BlogHistoryService();
