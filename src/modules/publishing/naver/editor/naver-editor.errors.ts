import { AppError } from "@/lib/errors";

export class NaverEditorError extends AppError {
  constructor(message: string, code: string, statusCode = 422) {
    super(message, code, statusCode);
    this.name = "NaverEditorError";
  }
}

export class NaverEditorAccessError extends NaverEditorError {
  constructor(message = "네이버 블로그 에디터에 접근하지 못했습니다.") {
    super(message, "NAVER_EDITOR_ACCESS_FAILED", 422);
    this.name = "NaverEditorAccessError";
  }
}

export class NaverEditorNotReadyError extends NaverEditorError {
  constructor(message = "네이버 블로그 에디터가 준비되지 않았습니다.") {
    super(message, "NAVER_EDITOR_NOT_READY", 422);
    this.name = "NaverEditorNotReadyError";
  }
}

export class NaverEditorValidationError extends NaverEditorError {
  constructor(message = "네이버 블로그 에디터 검증에 실패했습니다.") {
    super(message, "NAVER_EDITOR_VALIDATION_FAILED", 422);
    this.name = "NaverEditorValidationError";
  }
}
