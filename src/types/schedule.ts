export type ScheduleRecurrence = "ONCE" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type ScheduleStatus =
  | "ACTIVE"
  | "PAUSED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type ScheduleRunStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface ScheduleRecord {
  id: string;
  projectId: string;
  title: string;
  keyword: string;
  prompt: string;
  scheduledAt: string;
  recurrence: ScheduleRecurrence;
  customIntervalMinutes: number | null;
  status: ScheduleStatus;
  lastRunAt: string | null;
  lastJobId: string | null;
  lastHistoryId: string | null;
  lastError: string | null;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRunRecord {
  id: string;
  scheduleId: string;
  jobId: string | null;
  historyId: string | null;
  status: ScheduleRunStatus;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
}

export interface CreateScheduleInput {
  projectId: string;
  title: string;
  keyword: string;
  prompt?: string;
  scheduledAt: string;
  recurrence?: ScheduleRecurrence;
  customIntervalMinutes?: number | null;
}

export interface UpdateScheduleInput {
  title?: string;
  keyword?: string;
  prompt?: string;
  scheduledAt?: string;
  recurrence?: ScheduleRecurrence;
  customIntervalMinutes?: number | null;
}

export interface ScheduleFilter {
  projectId?: string;
  status?: ScheduleStatus;
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface ScheduleExecuteResult {
  scheduleId: string;
  runId: string;
  jobId: string;
  historyId: string;
}

export const SCHEDULE_RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  ONCE: "1회",
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
  CUSTOM: "사용자 지정",
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  ACTIVE: "활성",
  PAUSED: "일시정지",
  PROCESSING: "실행 중",
  COMPLETED: "완료",
  FAILED: "실패",
};
