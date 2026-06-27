import { randomUUID } from "crypto";
import type {
  NaverAccountCredentials,
  NaverAccountRecord,
  RegisterNaverAccountInput,
} from "./account.types";

interface StoredAccount extends NaverAccountRecord {
  password: string;
}

/**
 * In-memory Naver account registry — replace with encrypted DB storage for production.
 */
export class NaverAccountRegistry {
  private accounts = new Map<string, StoredAccount>();

  register(input: RegisterNaverAccountInput): NaverAccountRecord {
    const now = new Date().toISOString();
    const id = randomUUID();

    const record: StoredAccount = {
      id,
      username: input.username.trim(),
      label: input.label?.trim() || input.username.trim(),
      password: input.password,
      createdAt: now,
      updatedAt: now,
    };

    this.accounts.set(id, record);
    return this.toPublic(record);
  }

  getById(id: string): NaverAccountRecord | null {
    const record = this.accounts.get(id);
    return record ? this.toPublic(record) : null;
  }

  getCredentials(accountId: string): NaverAccountCredentials | null {
    const record = this.accounts.get(accountId);

    if (!record) {
      return null;
    }

    return {
      accountId: record.id,
      username: record.username,
      password: record.password,
    };
  }

  list(): NaverAccountRecord[] {
    return Array.from(this.accounts.values()).map((item) => this.toPublic(item));
  }

  update(id: string, input: Partial<RegisterNaverAccountInput>): NaverAccountRecord | null {
    const existing = this.accounts.get(id);

    if (!existing) {
      return null;
    }

    const updated: StoredAccount = {
      ...existing,
      ...(input.username !== undefined && { username: input.username.trim() }),
      ...(input.password !== undefined && { password: input.password }),
      ...(input.label !== undefined && { label: input.label.trim() }),
      updatedAt: new Date().toISOString(),
    };

    this.accounts.set(id, updated);
    return this.toPublic(updated);
  }

  delete(id: string): boolean {
    return this.accounts.delete(id);
  }

  private toPublic(record: StoredAccount): NaverAccountRecord {
    return {
      id: record.id,
      username: record.username,
      label: record.label,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const naverAccountRegistry = new NaverAccountRegistry();
