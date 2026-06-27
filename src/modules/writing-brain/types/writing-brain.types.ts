import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type {
  WritingBrainDraft,
  WritingBrainFinalValidation,
  WritingBrainIntent,
  WritingBrainOutline,
  WritingBrainQualityReview,
  WritingBrainResearch,
  WritingBrainRewrite,
} from "@/lib/schemas/writing-brain.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ResearchRecord } from "@/types/research";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";

export type WritingBrainStepId =
  | "intent-analysis"
  | "research"
  | "outline"
  | "draft"
  | "quality-review"
  | "rewrite"
  | "final-validation"
  | "history";

export interface WritingBrainState {
  intent?: WritingBrainIntent;
  organizedResearch?: WritingBrainResearch;
  outline?: WritingBrainOutline;
  draftOutput?: WritingBrainDraft;
  draft?: BodyDraft;
  titleData?: TitleGenerationResult;
  qualityReview?: WritingBrainQualityReview;
  rewrite?: WritingBrainRewrite;
  validation?: WritingBrainFinalValidation;
  result?: BlogFullResponse;
  historyId?: string;
}

export interface WritingBrainInput {
  keyword: string;
  research: ResearchRecord;
  projectId: string;
  customPrompt?: string;
}

export interface WritingBrainContext {
  workflow: WorkflowContext;
  state: WritingBrainState;
}

export interface WritingBrainStep<TOutput = unknown> {
  readonly stepId: WritingBrainStepId;
  validate(input: WritingBrainInput, context: WritingBrainContext): Promise<boolean>;
  execute(input: WritingBrainInput, context: WritingBrainContext): Promise<TOutput>;
}

export interface WritingBrainResult {
  state: WritingBrainState;
  stepsExecuted: WritingBrainStepId[];
}
