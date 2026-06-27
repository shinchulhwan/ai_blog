import type { NaverManager, NaverManagerContext } from "../managers/naver-manager.types";
import type { NaverCookie, NaverCookieStore } from "./cookie.types";
import { hasNaverAuthCookies, toPlaywrightCookies } from "./playwright-cookie.util";
import {
  deleteEncryptedFile,
  readEncryptedJson,
  writeEncryptedJson,
} from "../storage/encrypted-file.store";
import { getCookiesFilePath } from "../storage/auth-storage.paths";

interface PersistedCookiePayload {
  accountId: string;
  cookies: NaverCookie[];
  savedAt: string;
}

/**
 * Naver auth cookie persistence — encrypted disk storage for cookie auto-login.
 */
export class CookieManager implements NaverManager {
  private memory = new Map<string, NaverCookieStore>();

  async initialize(context: NaverManagerContext): Promise<void> {
    void context;
  }

  async validate(context: NaverManagerContext): Promise<boolean> {
    return Boolean(context.accountId);
  }

  async execute(context: NaverManagerContext): Promise<void> {
    const cookies = await this.loadCookies(context.accountId!);

    if (cookies?.length) {
      context.sessionId = context.sessionId ?? `cookie-restore-${context.accountId}`;
      this.save(context.sessionId, context.accountId!, cookies, context.mock);
    }
  }

  async dispose(context: NaverManagerContext): Promise<void> {
    void context;
  }

  save(
    sessionId: string,
    accountId: string,
    cookies: NaverCookie[],
    mock = false,
  ): NaverCookieStore {
    const store: NaverCookieStore = {
      sessionId,
      accountId,
      cookies,
      savedAt: new Date(),
      mock,
    };

    this.memory.set(sessionId, store);
    void this.persistByAccount(accountId, cookies, mock);
    return store;
  }

  load(sessionId: string): NaverCookieStore | null {
    return this.memory.get(sessionId) ?? null;
  }

  async restoreCookies(accountId: string): Promise<NaverCookie[] | null> {
    return this.loadCookies(accountId);
  }

  async loadCookies(accountId: string): Promise<NaverCookie[] | null> {
    return this.loadByAccount(accountId);
  }

  async saveCookies(
    accountId: string,
    cookies: NaverCookie[],
    sessionId?: string,
    mock = false,
  ): Promise<NaverCookieStore | void> {
    if (sessionId) {
      return this.save(sessionId, accountId, cookies, mock);
    }

    await this.persistByAccount(accountId, cookies, mock);
  }

  async loadByAccount(accountId: string): Promise<NaverCookie[] | null> {
    const payload = await readEncryptedJson<PersistedCookiePayload>(
      getCookiesFilePath(accountId),
    );

    if (!payload?.cookies?.length) {
      return null;
    }

    return payload.cookies;
  }

  async refreshCookies(sessionId: string, cookies: NaverCookie[]): Promise<NaverCookieStore | null> {
    return this.refresh(sessionId, cookies);
  }

  async refresh(sessionId: string, cookies: NaverCookie[]): Promise<NaverCookieStore | null> {
    const existing = this.memory.get(sessionId);

    if (!existing) {
      return null;
    }

    const store: NaverCookieStore = {
      ...existing,
      cookies,
      savedAt: new Date(),
      mock: existing.mock,
    };

    this.memory.set(sessionId, store);
    await this.persistByAccount(existing.accountId, cookies);
    return store;
  }

  async clear(sessionId: string): Promise<void> {
    const existing = this.memory.get(sessionId);

    if (existing) {
      await this.clearByAccount(existing.accountId);
    }

    this.memory.delete(sessionId);
  }

  async clearByAccount(accountId: string): Promise<void> {
    for (const [sessionId, store] of this.memory.entries()) {
      if (store.accountId === accountId) {
        this.memory.delete(sessionId);
      }
    }

    await deleteEncryptedFile(getCookiesFilePath(accountId));
  }

  hasValidCookies(sessionId: string): boolean {
    const store = this.load(sessionId);
    return Boolean(store && hasNaverAuthCookies(store.cookies));
  }

  async hasPersistedCookies(accountId: string): Promise<boolean> {
    const cookies = await this.loadByAccount(accountId);
    return Boolean(cookies && hasNaverAuthCookies(cookies));
  }

  async applyToBrowser(
    accountId: string,
    addCookies: (cookies: ReturnType<typeof toPlaywrightCookies>) => Promise<void>,
  ): Promise<boolean> {
    const cookies = await this.loadByAccount(accountId);

    if (!cookies || !hasNaverAuthCookies(cookies)) {
      return false;
    }

    await addCookies(toPlaywrightCookies(cookies));
    return true;
  }

  private async persistByAccount(
    accountId: string,
    cookies: NaverCookie[],
    mock = false,
  ): Promise<void> {
    if (mock) {
      return;
    }

    const payload: PersistedCookiePayload = {
      accountId,
      cookies,
      savedAt: new Date().toISOString(),
    };

    await writeEncryptedJson(getCookiesFilePath(accountId), payload);
  }
}

export const cookieManager = new CookieManager();
