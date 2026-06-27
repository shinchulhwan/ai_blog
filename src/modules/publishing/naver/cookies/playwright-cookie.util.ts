import type { Cookie } from "playwright";
import type { NaverCookie } from "./cookie.types";

export function toNaverCookies(cookies: Cookie[]): NaverCookie[] {
  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
  }));
}

export function toPlaywrightCookies(cookies: NaverCookie[]): Cookie[] {
  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires ?? -1,
    httpOnly: cookie.httpOnly ?? false,
    secure: cookie.secure ?? false,
    sameSite: cookie.sameSite ?? "Lax",
  }));
}

export function hasNaverAuthCookies(cookies: NaverCookie[]): boolean {
  return cookies.some(
    (cookie) =>
      cookie.name === "NID_SES" ||
      cookie.name === "NID_AUT" ||
      cookie.name === "NID_JKL",
  );
}
