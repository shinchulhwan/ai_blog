import { randomUUID } from "crypto";
import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import type { CreateSessionInput, NaverSession, NaverSessionStatus } from "./session.types";
import {
  deleteEncryptedFile,
  readEncryptedJson,
  writeEncryptedJson,
} from "../storage/encrypted-file.store";
import { getSessionFilePath } from "../storage/auth-storage.paths";

const DEFAULT_TTL_MINUTES = 60 * 24 * 7;

interface PersistedSessionPayload {
  session: {
    id: string;
    accountId: string;
    browserId: string;
    pageId: string | null;
    status: NaverSessionStatus;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string | null;
    mock: boolean;
  };
}

/**
 * Naver login session lifecycle — in-memory + encrypted disk persistence.
 */
export class SessionManager implements NaverManager {
  private sessions = new Map<string, NaverSession>();

  async initialize(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    return Boolean(context.accountId);
  }

  async execute(context: NaverManagerContext): Promise<void> {
    const restored = await this.restoreSession(context.accountId!);

    if (restored && restored.status === "active" && !this.isExpired(restored)) {
      context.sessionId = restored.id;
      context.browserId = restored.browserId ?? context.browserId;
      context.pageId = restored.pageId ?? context.pageId;
    }
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    if (context.sessionId && context.mock) {
      await this.destroy(context.sessionId);
      context.sessionId = null;
    }
  }

  create(input: CreateSessionInput): NaverSession {
    const now = new Date();
    const ttl = input.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    const expiresAt = new Date(now.getTime() + ttl * 60 * 1000);

    const session: NaverSession = {
      id: randomUUID(),
      accountId: input.accountId,
      browserId: input.browserId,
      pageId: input.pageId ?? null,
      status: "active",
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
      mock: input.mock ?? false,
    };

    this.sessions.set(session.id, session);
    void this.saveSession(input.accountId, session);
    return session;
  }

  get(sessionId: string): NaverSession | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (this.isSessionExpired(sessionId)) {
      const expired = { ...session, status: "expired" as NaverSessionStatus };
      this.sessions.set(sessionId, expired);
      return expired;
    }

    return session;
  }

  async restoreSession(accountId: string): Promise<NaverSession | null> {
    return this.loadPersisted(accountId);
  }

  async saveSession(accountId: string, session: NaverSession): Promise<void> {
    await this.persist(accountId, session);
  }

  isSessionExpired(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return true;
    }

    return this.isExpired(session);
  }

  async loadPersisted(accountId: string): Promise<NaverSession | null> {
    const payload = await readEncryptedJson<PersistedSessionPayload>(
      getSessionFilePath(accountId),
    );

    if (!payload?.session) {
      return null;
    }

    const session = this.deserialize(payload.session);

    if (this.isExpired(session)) {
      return { ...session, status: "expired" };
    }

    this.sessions.set(session.id, session);
    return session;
  }

  touch(sessionId: string): NaverSession | null {
    const session = this.get(sessionId);

    if (!session || session.status !== "active") {
      return session;
    }

    const updated: NaverSession = {
      ...session,
      lastUsedAt: new Date(),
    };

    this.sessions.set(sessionId, updated);
    void this.persist(updated.accountId, updated);
    return updated;
  }

  refresh(sessionId: string, ttlMinutes = DEFAULT_TTL_MINUTES): NaverSession | null {
    const session = this.get(sessionId);

    if (!session || session.status !== "active") {
      return null;
    }

    const updated: NaverSession = {
      ...session,
      status: "active",
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    };

    this.sessions.set(sessionId, updated);
    void this.persist(updated.accountId, updated);
    return updated;
  }

  invalidate(sessionId: string): void {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    const updated = { ...session, status: "invalid" as NaverSessionStatus };
    this.sessions.set(sessionId, updated);
    void this.persist(updated.accountId, updated);
  }

  async destroy(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      await deleteEncryptedFile(getSessionFilePath(session.accountId));
    }

    this.sessions.delete(sessionId);
  }

  isValid(sessionId: string): boolean {
    const session = this.get(sessionId);
    return session?.status === "active";
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.get(sessionId);

    if (!session) {
      return false;
    }

    if (session.status !== "active") {
      return false;
    }

    if (this.isExpired(session)) {
      this.invalidate(sessionId);
      return false;
    }

    return true;
  }

  listByAccount(accountId: string): NaverSession[] {
    return Array.from(this.sessions.values()).filter(
      (item) => item.accountId === accountId && item.status === "active",
    );
  }

  async persist(accountId: string, session: NaverSession): Promise<void> {
    if (session.mock) {
      return;
    }

    const payload: PersistedSessionPayload = {
      session: {
        id: session.id,
        accountId: session.accountId,
        browserId: session.browserId,
        pageId: session.pageId,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        lastUsedAt: session.lastUsedAt.toISOString(),
        expiresAt: session.expiresAt?.toISOString() ?? null,
        mock: session.mock,
      },
    };

    await writeEncryptedJson(getSessionFilePath(accountId), payload);
  }

  private deserialize(raw: PersistedSessionPayload["session"]): NaverSession {
    return {
      id: raw.id,
      accountId: raw.accountId,
      browserId: raw.browserId,
      pageId: raw.pageId,
      status: raw.status,
      createdAt: new Date(raw.createdAt),
      lastUsedAt: new Date(raw.lastUsedAt),
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : null,
      mock: raw.mock,
    };
  }

  private isExpired(session: NaverSession): boolean {
    if (!session.expiresAt) {
      return false;
    }

    return session.expiresAt.getTime() <= Date.now();
  }
}

export const sessionManager = new SessionManager();
