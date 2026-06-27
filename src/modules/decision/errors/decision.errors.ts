import { AppError } from "@/lib/errors";

export class DecisionSkippedError extends AppError {
  constructor(
    message: string,
    public readonly decisionId?: string,
  ) {
    super(message, "DECISION_SKIP", 422);
    this.name = "DecisionSkippedError";
  }
}

export class DecisionReviewError extends AppError {
  constructor(
    message: string,
    public readonly decisionId?: string,
  ) {
    super(`[검토 필요] ${message}`, "DECISION_REVIEW", 409);
    this.name = "DecisionReviewError";
  }
}
