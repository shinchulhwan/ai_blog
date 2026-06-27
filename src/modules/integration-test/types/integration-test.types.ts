import type { EngineId } from "@/modules/core";
import { ENGINE_EXECUTION_ORDER } from "@/modules/core/types/engine.types";

export type IntegrationTestStatus = "SUCCESS" | "FAILED";

export type IntegrationTestCategory =
  | "engine"
  | "workflow";

export type IntegrationTestMethod = "validate" | "execute" | "rollback";

export type WorkflowScenarioId =
  | "normal-execution"
  | "openai-failure"
  | "json-parse-failure"
  | "db-save-failure"
  | "timeout"
  | "retry"
  | "rollback";

export interface IntegrationTestCaseResult {
  id: string;
  category: IntegrationTestCategory;
  engineId?: EngineId;
  method?: IntegrationTestMethod;
  scenarioId?: WorkflowScenarioId;
  name: string;
  passed: boolean;
  durationMs: number;
  errorMessage?: string;
}

export interface IntegrationTestReport {
  status: IntegrationTestStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  engineOrder: EngineId[];
  results: IntegrationTestCaseResult[];
}

export interface IntegrationTestWorkflowResult {
  status: IntegrationTestStatus;
  total: number;
  passed: number;
  failed: number;
  logFile: string;
  report: IntegrationTestReport;
}

export const INTEGRATION_ENGINE_ORDER: EngineId[] = [...ENGINE_EXECUTION_ORDER];

export const INTEGRATION_FULL_PHASES: EngineId[] = [...ENGINE_EXECUTION_ORDER];
