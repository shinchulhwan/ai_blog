import { runWorkflowStep } from "@/modules/workflow/engine/run-workflow-step";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import type { ResearchRecord } from "@/types/research";
import { draftStep } from "./draft.step";
import { finalValidationStep } from "./final-validation.step";
import { intentAnalysisStep } from "./intent-analysis.step";
import { outlineStep } from "./outline.step";
import { qualityReviewStep } from "./quality-review.step";
import { researchOrganizerStep } from "./research-organizer.step";
import { rewriteStep } from "./rewrite.step";
import type {
  WritingBrainContext,
  WritingBrainInput,
  WritingBrainResult,
  WritingBrainState,
  WritingBrainStep,
  WritingBrainStepId,
} from "../types/writing-brain.types";
import { WRITING_BRAIN_STEPS } from "../writing-brain.steps";

const STEP_ORDER: WritingBrainStep[] = [
  intentAnalysisStep,
  researchOrganizerStep,
  outlineStep,
  draftStep,
  qualityReviewStep,
  rewriteStep,
  finalValidationStep,
];

export interface WritingBrainEngineInput {
  keyword: string;
  research: ResearchRecord;
  projectId: string;
  customPrompt?: string;
}

export class WritingBrainEngine {
  async execute(
    workflow: WorkflowContext,
    input: WritingBrainEngineInput,
  ): Promise<WritingBrainResult> {
    const state: WritingBrainState = {};
    const context: WritingBrainContext = { workflow, state };
    const brainInput: WritingBrainInput = {
      keyword: input.keyword,
      research: input.research,
      projectId: input.projectId,
      customPrompt: input.customPrompt ?? workflow.customPrompt,
    };

    const stepsExecuted: WritingBrainStepId[] = [];

    for (const step of STEP_ORDER) {
      const stepConfig = WRITING_BRAIN_STEPS[step.stepId];

      await runWorkflowStep(workflow, stepConfig, async () => {
        const valid = await step.validate(brainInput, context);

        if (!valid) {
          throw new Error(`${step.stepId} 단계 사전 조건을 충족하지 못했습니다.`);
        }

        await step.execute(brainInput, context);
      });

      stepsExecuted.push(step.stepId);
    }

    return { state, stepsExecuted };
  }
}

export const writingBrainEngine = new WritingBrainEngine();
