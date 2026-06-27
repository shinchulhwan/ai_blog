import type { EngineId } from "@/modules/core";
import { ENGINE_EXECUTION_ORDER } from "@/modules/core/types/engine.types";

export type E2eWorkflowStatus = "SUCCESS" | "FAILED";

export type E2eWorkflowStepId =
  | "keyword-input"
  | "workflow-start"
  | "decision"
  | "research"
  | "writing"
  | "quality"
  | "image"
  | "history"
  | "publishing"
  | "workflow-complete";

export interface E2eWorkflowStepDefinition {
  id: E2eWorkflowStepId;
  name: string;
  engineId: EngineId | null;
}

export const E2E_WORKFLOW_STEPS: E2eWorkflowStepDefinition[] = [
  { id: "keyword-input", name: "키워드 입력", engineId: null },
  { id: "workflow-start", name: "Workflow 시작", engineId: null },
  { id: "decision", name: "Decision Engine", engineId: "decision" },
  { id: "research", name: "Research Engine", engineId: "research" },
  { id: "writing", name: "Writing Brain", engineId: "writing" },
  { id: "quality", name: "Quality Engine", engineId: "quality" },
  { id: "image", name: "Image Engine", engineId: "image" },
  { id: "history", name: "History 저장", engineId: "history" },
  { id: "publishing", name: "PublishPackage 생성", engineId: "publishing" },
  { id: "workflow-complete", name: "Workflow 완료", engineId: null },
];

export const E2E_ENGINE_PHASES: EngineId[] = ENGINE_EXECUTION_ORDER.filter(
  (engineId) => engineId !== "scheduler",
);

export interface E2eStepLog {
  stepId: E2eWorkflowStepId;
  name: string;
  engineId: EngineId | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  retryCount: number;
  passed: boolean;
  errorMessage?: string;
}

export interface E2eWorkflowSummary {
  status: E2eWorkflowStatus;
  totalDurationMs: number;
  generatedTitle: string | null;
  imageCount: number;
  historySaved: boolean;
  publishPackageCreated: boolean;
  failedStep: E2eWorkflowStepId | null;
  failedEngine: EngineId | null;
}

export interface E2eWorkflowReport {
  status: E2eWorkflowStatus;
  keyword: string;
  projectId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: E2eWorkflowSummary;
  steps: E2eStepLog[];
}

export interface E2eWorkflowTestResult {
  status: E2eWorkflowStatus;
  logFile: string;
  summary: E2eWorkflowSummary;
  report: E2eWorkflowReport;
  failedEngine: EngineId | null;
}
