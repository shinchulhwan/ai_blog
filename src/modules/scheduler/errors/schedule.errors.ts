import { AppError } from "@/lib/errors";

export class ScheduleNotFoundError extends AppError {
  constructor(id?: string) {
    super(
      id ? `예약을 찾을 수 없습니다: ${id}` : "예약을 찾을 수 없습니다.",
      "SCHEDULE_NOT_FOUND",
      404,
    );
    this.name = "ScheduleNotFoundError";
  }
}

export class ScheduleInvalidStateError extends AppError {
  constructor(message: string) {
    super(message, "SCHEDULE_INVALID_STATE", 409);
    this.name = "ScheduleInvalidStateError";
  }
}
