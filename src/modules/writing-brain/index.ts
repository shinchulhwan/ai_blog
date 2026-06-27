export type {
  WritingBrainContext,
  WritingBrainInput,
  WritingBrainResult,
  WritingBrainState,
  WritingBrainStep,
  WritingBrainStepId,
} from "./types/writing-brain.types";

export { WRITING_BRAIN_STEPS } from "./writing-brain.steps";

export {
  WritingBrainEngine,
  writingBrainEngine,
} from "./services/writing-brain.engine";
export type { WritingBrainEngineInput } from "./services/writing-brain.engine";

export { intentAnalysisStep, IntentAnalysisStep } from "./services/intent-analysis.step";
export { researchOrganizerStep, ResearchOrganizerStep } from "./services/research-organizer.step";
export { outlineStep, OutlineStep } from "./services/outline.step";
export { draftStep, DraftStep } from "./services/draft.step";
export { qualityReviewStep, QualityReviewStep } from "./services/quality-review.step";
export { rewriteStep, RewriteStep } from "./services/rewrite.step";
export { finalValidationStep, FinalValidationStep } from "./services/final-validation.step";
export { historySaveStep, HistorySaveStep } from "./services/history-save.step";

export type {
  WritingBrainIntent,
  WritingBrainResearch,
  WritingBrainOutline,
  WritingBrainDraft,
  WritingBrainQualityReview,
  WritingBrainRewrite,
  WritingBrainFinalValidation,
} from "@/lib/schemas/writing-brain.schema";

export { WRITING_BRAIN_PASSING_SCORE } from "@/lib/schemas/writing-brain.schema";
