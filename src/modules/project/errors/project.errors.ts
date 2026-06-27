import { AppError } from "@/lib/errors";

export class ProjectNotFoundError extends AppError {
  constructor(id?: string) {
    super(
      id ? `프로젝트를 찾을 수 없습니다: ${id}` : "프로젝트를 찾을 수 없습니다.",
      "PROJECT_NOT_FOUND",
      404,
    );
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectInvalidStateError extends AppError {
  constructor(message: string) {
    super(message, "PROJECT_INVALID_STATE", 409);
    this.name = "ProjectInvalidStateError";
  }
}
