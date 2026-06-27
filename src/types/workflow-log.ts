export type WorkflowRunStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type WorkflowStepStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface WorkflowStepLogRecord {
  id: string;
  runId: string;
  stepId: string;
  stepLabel: string;
  status: WorkflowStepStatus;
  attempt: number;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface WorkflowRunRecord {
  id: string;
  jobId: string;
  workflowId: string;
  keyword: string;
  status: WorkflowRunStatus;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  steps?: WorkflowStepLogRecord[];
}
