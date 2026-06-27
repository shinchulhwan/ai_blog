export interface NaverCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface NaverCookieStore {
  sessionId: string;
  accountId: string;
  cookies: NaverCookie[];
  savedAt: Date;
  mock: boolean;
}
