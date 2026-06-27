import type { Page } from "playwright";
import { hasNaverAuthCookies, toNaverCookies } from "../cookies/playwright-cookie.util";

export const NAVER_LOGIN_URL = "https://nid.naver.com/nidlogin.login";
export const NAVER_BLOG_URL = "https://blog.naver.com";

export async function verifyNaverLoggedIn(page: Page): Promise<boolean> {
  const cookies = toNaverCookies(await page.context().cookies());

  if (!hasNaverAuthCookies(cookies)) {
    return false;
  }

  const url = page.url();

  if (url.includes("nidlogin.login") || url.includes("nid.naver.com/nidlogin")) {
    return false;
  }

  return true;
}

export async function detectNaverTwoFactor(page: Page): Promise<boolean> {
  const url = page.url();

  if (
    url.includes("2step") ||
    url.includes("cert") ||
    url.includes("otp") ||
    url.includes("challenge") ||
    url.includes("deviceConfirm")
  ) {
    return true;
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");

  return /2단계|2차\s*인증|OTP|본인\s*확인|휴대폰\s*인증|인증번호|새\s*기기/i.test(bodyText);
}

export async function detectNaverCaptcha(page: Page): Promise<boolean> {
  const captchaSelectors = [
    "#captcha",
    ".captcha",
    "#captchaimg",
    "iframe[title*='captcha' i]",
    "iframe[src*='captcha' i]",
  ];

  for (const selector of captchaSelectors) {
    const visible = await page.locator(selector).first().isVisible().catch(() => false);

    if (visible) {
      return true;
    }
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");
  return /자동\s*입력\s*방지|captcha|보안\s*문자/i.test(bodyText);
}

export async function detectNaverLoginFailure(page: Page): Promise<string | null> {
  const selectors = [
    "#err_common",
    "#err_empty_id",
    "#err_empty_pw",
    ".error_message",
    ".login_error_wrap",
    ".error_msg",
  ];

  for (const selector of selectors) {
    const element = page.locator(selector).first();
    const visible = await element.isVisible().catch(() => false);

    if (!visible) {
      continue;
    }

    const text = (await element.innerText().catch(() => "")).trim();

    if (text) {
      return text;
    }
  }

  return null;
}

export async function openNaverBlog(page: Page): Promise<void> {
  await page.goto(NAVER_BLOG_URL, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
}

async function fillNaverInput(page: Page, selector: string, value: string): Promise<void> {
  const input = page.locator(selector);
  await input.waitFor({ state: "visible", timeout: 15_000 });
  await input.click();
  await page.waitForTimeout(250);

  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");

  try {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(async (text) => {
      await navigator.clipboard.writeText(text);
    }, value);
    await page.keyboard.press("Control+V");
    await page.waitForTimeout(300);

    const pasted = await input.inputValue();

    if (pasted === value) {
      return;
    }
  } catch {
    // clipboard unavailable — fall back to keyboard typing
  }

  await input.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await input.pressSequentially(value, { delay: 60 + Math.floor(Math.random() * 40) });
}

async function waitForLoginOutcome(page: Page, timeoutMs = 60_000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await detectNaverTwoFactor(page)) {
      return;
    }

    if (await detectNaverCaptcha(page)) {
      return;
    }

    const loginError = await detectNaverLoginFailure(page);

    if (loginError && page.url().includes("nidlogin")) {
      return;
    }

    const cookies = toNaverCookies(await page.context().cookies());

    if (hasNaverAuthCookies(cookies) && !page.url().includes("nidlogin.login")) {
      return;
    }

    await page.waitForTimeout(500);
  }
}

export async function performCredentialLogin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.goto(NAVER_LOGIN_URL, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  await fillNaverInput(page, "#id", username);
  await fillNaverInput(page, "#pw", password);

  const loginButton = page
    .locator("#log\\.login, button.btn_login, input.btn_login, button[type='submit']")
    .first();

  await loginButton.waitFor({ state: "visible", timeout: 10_000 });
  await loginButton.click();

  await waitForLoginOutcome(page);
  await page.waitForLoadState("domcontentloaded", { timeout: 30_000 }).catch(() => null);
}
