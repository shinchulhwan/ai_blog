export type BlogHistoryStatus =
  | "CREATED"
  | "READY"
  | "PUBLISHING"
  | "PUBLISHED"
  | "FAILED";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HistoryImageAssets {
  representativeImagePrompt: string;
  bodyImagePrompts: string[];
  thumbnailText: string;
  altTags: {
    representative: string;
    body: string[];
  };
  imageFilenames: {
    representative: string;
    body: string[];
  };
  coverImageUrl?: string | null;
  contentImageUrls?: string[];
  thumbnailUrl?: string | null;
}

export interface BlogHistoryRecord {
  id: string;
  projectId: string;
  keyword: string;
  selectedTitle: string;
  content: string;
  metaDescription: string;
  hashtags: string[];
  faq: FaqItem[];
  imagePrompt: string;
  imageAssets: HistoryImageAssets | null;
  seoScore: number;
  status: BlogHistoryStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  naverPostId: string | null;
  publishUrl: string | null;
  publishError: string | null;
}

export interface BlogHistoryListItem {
  id: string;
  projectId: string;
  keyword: string;
  selectedTitle: string;
  metaDescription: string;
  seoScore: number;
  status: BlogHistoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BlogHistoryFilter {
  projectId?: string;
  search?: string;
  status?: BlogHistoryStatus;
  limit?: number;
  offset?: number;
}

export const BLOG_HISTORY_STATUS_LABELS: Record<BlogHistoryStatus, string> = {
  CREATED: "생성됨",
  READY: "발행 준비",
  PUBLISHING: "발행 중",
  PUBLISHED: "발행됨",
  FAILED: "실패",
};

/** Placeholder for future Naver publishing integration */
export interface PublishToNaverInput {
  historyId: string;
}

export interface HistoryService {
  saveFromBlogResult(
    keyword: string,
    blog: import("@/lib/schemas/blog-response.schema").BlogFullResponse,
    status?: BlogHistoryStatus,
    projectId?: string,
  ): Promise<BlogHistoryRecord>;
  list(filter?: BlogHistoryFilter): Promise<BlogHistoryListItem[]>;
  getById(id: string): Promise<BlogHistoryRecord | null>;
  delete(id: string): Promise<void>;
  regenerate(id: string): Promise<BlogHistoryRecord>;
}
