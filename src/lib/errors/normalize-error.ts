import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import {
  AIProviderError,
  AppError,
  DatabaseError,
  JsonParseError,
  NetworkError,
  TimeoutError,
} from "@/lib/errors";

const OPENAI_ERROR_MESSAGES: Record<number, string> = {
  401: "OpenAI API 키가 올바르지 않습니다.",
  403: "OpenAI API 접근이 거부되었습니다.",
  429: "OpenAI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  500: "OpenAI 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  503: "OpenAI 서비스를 일시적으로 사용할 수 없습니다.",
};

export function normalizeServiceError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof OpenAI.APIError) {
    const message =
      OPENAI_ERROR_MESSAGES[error.status ?? 0] ??
      `OpenAI API 오류: ${error.message || "요청에 실패했습니다."}`;
    return new AIProviderError(message, error.status ?? 502);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return new DatabaseError("데이터베이스 처리 중 오류가 발생했습니다.");
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError("데이터베이스에 연결할 수 없습니다.");
  }

  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    return new JsonParseError("AI 응답 JSON 형식이 올바르지 않습니다.");
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("etimedout") ||
      message.includes("aborted")
    ) {
      return new TimeoutError("요청 시간이 초과되었습니다. 다시 시도해 주세요.");
    }

    if (
      message.includes("network") ||
      message.includes("fetch failed") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("socket")
    ) {
      return new NetworkError("네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.");
    }

    if (message.includes("json") || message.includes("형식")) {
      return new JsonParseError(error.message);
    }

    return new AppError(error.message, "INTERNAL_ERROR", 500);
  }

  return new AppError("알 수 없는 오류가 발생했습니다.", "INTERNAL_ERROR", 500);
}

export function getKoreanErrorMessage(error: unknown): string {
  return normalizeServiceError(error).message;
}
