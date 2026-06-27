import { AppError } from "@/lib/errors";

export class PhotoNotFoundError extends AppError {
  constructor(id?: string) {
    super(
      id ? `사진을 찾을 수 없습니다. (${id})` : "사진을 찾을 수 없습니다.",
      "PHOTO_NOT_FOUND",
      404,
    );
    this.name = "PhotoNotFoundError";
  }
}

export class PhotoInvalidFileError extends AppError {
  constructor(message: string) {
    super(message, "PHOTO_INVALID_FILE", 400);
    this.name = "PhotoInvalidFileError";
  }
}
