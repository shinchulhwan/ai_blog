import { AppError } from "@/lib/errors";

export class NaverPublishError extends AppError {
  constructor(message: string, code: string, statusCode = 422) {
    super(message, code, statusCode);
    this.name = "NaverPublishError";
  }
}

export class NaverPublishFailedError extends NaverPublishError {
  constructor(message = "네이버 블로그 발행에 실패했습니다.") {
    super(message, "NAVER_PUBLISH_FAILED", 422);
    this.name = "NaverPublishFailedError";
  }
}

export class NaverPublishValidationError extends NaverPublishError {
  constructor(message = "발행 전 검증에 실패했습니다.") {
    super(message, "NAVER_PUBLISH_VALIDATION_FAILED", 422);
    this.name = "NaverPublishValidationError";
  }
}

export class NaverPublishTimeoutError extends NaverPublishError {
  constructor(message = "네이버 블로그 발행 완료 대기 시간이 초과되었습니다.") {
    super(message, "NAVER_PUBLISH_TIMEOUT", 408);
    this.name = "NaverPublishTimeoutError";
  }
}
