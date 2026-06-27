export type NaverSessionStatus = "active" | "expired" | "invalid";

export interface NaverSession {
  id: string;
  accountId: string;
  browserId: string;
  pageId: string | null;
  status: NaverSessionStatus;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date | null;
  mock: boolean;
}

export interface CreateSessionInput {
  accountId: string;
  browserId: string;
  pageId?: string | null;
  ttlMinutes?: number;
  mock?: boolean;
}
