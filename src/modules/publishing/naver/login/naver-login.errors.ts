import { AppError } from "@/lib/errors";

export class NaverLoginError extends AppError {
  constructor(message: string, code: string, statusCode = 401) {
    super(message, code, statusCode);
    this.name = "NaverLoginError";
  }
}

export class NaverLoginFailedError extends NaverLoginError {
  constructor(message = "네이버 로그인에 실패했습니다.") {
    super(message, "NAVER_LOGIN_FAILED", 401);
    this.name = "NaverLoginFailedError";
  }
}

export class NaverSessionExpiredError extends NaverLoginError {
  constructor(message = "네이버 세션이 만료되었습니다. 다시 로그인해 주세요.") {
    super(message, "NAVER_SESSION_EXPIRED", 401);
    this.name = "NaverSessionExpiredError";
  }
}

export class NaverTwoFactorRequiredError extends NaverLoginError {
  constructor(
    message = "네이버 2차 인증이 필요합니다. 수동 인증 후 다시 시도해 주세요.",
  ) {
    super(message, "NAVER_TWO_FACTOR_REQUIRED", 403);
    this.name = "NaverTwoFactorRequiredError";
  }
}

export class NaverBrowserClosedError extends NaverLoginError {
  constructor(message = "브라우저가 종료되었습니다. 다시 시도해 주세요.") {
    super(message, "NAVER_BROWSER_CLOSED", 503);
    this.name = "NaverBrowserClosedError";
  }
}

export function wrapNaverBrowserError(error: unknown): Error {
  if (error instanceof NaverLoginError) {
    return error;
  }

  if (error instanceof Error) {
    if (/Target page, context or browser has been closed|Browser has been closed/i.test(error.message)) {
      return new NaverBrowserClosedError();
    }

    return error;
  }

  return new NaverLoginFailedError(String(error));
}
