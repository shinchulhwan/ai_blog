export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AIProviderError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, "AI_PROVIDER_ERROR", statusCode);
    this.name = "AIProviderError";
  }
}

export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(`${feature} is not implemented yet`, "NOT_IMPLEMENTED", 501);
    this.name = "NotImplementedError";
  }
}

export class JsonParseError extends AppError {
  constructor(message = "AI 응답 JSON 형식이 올바르지 않습니다.") {
    super(message, "JSON_PARSE_ERROR", 502);
    this.name = "JsonParseError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "데이터베이스 처리 중 오류가 발생했습니다.") {
    super(message, "DATABASE_ERROR", 500);
    this.name = "DatabaseError";
  }
}

export class TimeoutError extends AppError {
  constructor(message = "요청 시간이 초과되었습니다. 다시 시도해 주세요.") {
    super(message, "TIMEOUT_ERROR", 504);
    this.name = "TimeoutError";
  }
}

export class NetworkError extends AppError {
  constructor(message = "네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.") {
    super(message, "NETWORK_ERROR", 503);
    this.name = "NetworkError";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "오류가 발생했습니다.";
}

export function toApiErrorResponse(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  return {
    error: getErrorMessage(error),
    code: "INTERNAL_ERROR",
    statusCode: 500,
  };
}

export {
  getKoreanErrorMessage,
  normalizeServiceError,
} from "./errors/normalize-error";
