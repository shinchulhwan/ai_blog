export type KeywordStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface KeywordRecord {
  id: string;
  projectId: string;
  keyword: string;
  category: string;
  status: KeywordStatus;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt: string | null;
  scheduledAt: string | null;
  priority: number;
  retryCount: number;
  lastError: string | null;
}

export interface CreateKeywordInput {
  projectId?: string;
  keyword: string;
  category: string;
  status?: KeywordStatus;
}

export interface UpdateKeywordInput {
  keyword?: string;
  category?: string;
  status?: KeywordStatus;
}

export interface KeywordListFilters {
  projectId?: string;
  status?: KeywordStatus;
  category?: string;
}

export const KEYWORD_STATUS_LABELS: Record<KeywordStatus, string> = {
  PENDING: "대기",
  COMPLETED: "완료",
  FAILED: "실패",
};

export const DEFAULT_KEYWORD_CATEGORIES = [
  "일반",
  "리뷰",
  "뉴스",
  "쇼핑",
  "로컬",
  "SEO",
] as const;
