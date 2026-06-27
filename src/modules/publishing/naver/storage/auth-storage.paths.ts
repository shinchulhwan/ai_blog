import path from "path";

const AUTH_ROOT = path.join(process.cwd(), "data", "naver-auth");

export function sanitizeAccountKey(accountId: string): string {
  return accountId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getAccountAuthDir(accountId: string): string {
  return path.join(AUTH_ROOT, sanitizeAccountKey(accountId));
}

export function getCookiesFilePath(accountId: string): string {
  return path.join(getAccountAuthDir(accountId), "cookies.enc");
}

export function getSessionFilePath(accountId: string): string {
  return path.join(getAccountAuthDir(accountId), "session.enc");
}
