import type { ImageResult } from "@/lib/schemas/image-result.schema";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type { FinalValidation } from "@/lib/schemas/writing-engine-v2.schema";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";
import type { ContentPlan, IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";
import type { DecisionResult } from "@/types/decision";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { PublishOutput } from "@/modules/publishing";
import type { ContentReview } from "@/modules/reviewer";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ResearchRecord } from "@/types/research";

export type EngineId =
  | "decision"
  | "research"
  | "writing"
  | "quality"
  | "image"
  | "history"
  | "publishing"
  | "scheduler";

export const ENGINE_IDS: EngineId[] = [
  "decision",
  "research",
  "writing",
  "quality",
  "image",
  "history",
  "publishing",
  "scheduler",
];

export const ENGINE_EXECUTION_ORDER: EngineId[] = [
  "decision",
  "research",
  "writing",
  "quality",
  "image",
  "history",
  "publishing",
  "scheduler",
];

export interface CoreEngineState {
  research?: ResearchRecord;
  decision?: DecisionResult;
  decisionPending?: boolean;
  seoIntelligence?: SeoIntelligenceResult;
  intent?: IntentAnalysis;
  plan?: ContentPlan;
  titleData?: TitleGenerationResult;
  draft?: BodyDraft;
  review?: ContentReview;
  validation?: FinalValidation;
  result?: BlogFullResponse;
  historyId?: string;
  publishPackage?: PublishPackage;
  publishOutput?: PublishOutput;
  imageMock?: boolean;
  imageResult?: ImageResult;
  publishMock?: boolean;
  scheduleCompleted?: boolean;
  writingBrainCompleted?: boolean;
}

export interface CoreEngineContext {
  workflow: WorkflowContext;
  state: CoreEngineState;
  rollbacks: EngineRollbackEntry[];
}

export interface EngineRollbackEntry {
  engineId: EngineId;
  action: () => Promise<void>;
}

export interface CoreEngineInput {
  keyword: string;
  research?: ResearchRecord;
  jobId?: string;
  publish?: boolean;
  phases?: EngineId[];
}

export interface CoreEngineResult {
  state: CoreEngineState;
  enginesExecuted: EngineId[];
}

export interface EngineExecutionLog {
  engineId: EngineId;
  durationMs: number;
  attempt: number;
  success: boolean;
  errorMessage?: string;
}

export interface Engine<TInput = CoreEngineInput, TOutput = unknown> {
  readonly id: EngineId;
  execute(input: TInput, context: CoreEngineContext): Promise<TOutput>;
  validate(input: TInput, context: CoreEngineContext): Promise<boolean>;
  rollback(context: CoreEngineContext): Promise<void>;
}
