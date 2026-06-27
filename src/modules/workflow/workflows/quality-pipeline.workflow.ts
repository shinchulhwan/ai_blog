import { coreEngineService } from "@/modules/core";
import type { ResearchRecord } from "@/types/research";
import type { WorkflowContext, WorkflowDefinition } from "../types/workflow.types";
import {
  assembleQualityResult,
  type QualityPipelineResult,
} from "./quality-pipeline.steps";

export interface QualityPipelineInput {
  keyword: string;
  research?: ResearchRecord;
  jobId?: string;
}

export async function executeQualityPipeline(
  context: WorkflowContext,
  input: QualityPipelineInput,
): Promise<QualityPipelineResult> {
  const { state } = await coreEngineService.run(context, {
    keyword: input.keyword,
    research: input.research,
    jobId: input.jobId ?? context.jobId,
    phases: ["decision", "research", "writing", "quality", "image"],
  });

  return {
    titleData: state.titleData!,
    draft: state.draft!,
    review: state.review!,
    validation: state.validation!,
    result: state.result!,
    decision: state.decision!,
    intent: state.intent!,
    plan: state.plan!,
    seoIntelligence: state.seoIntelligence!,
  };
}

export const qualityPipelineWorkflow: WorkflowDefinition<
  QualityPipelineInput,
  QualityPipelineResult
> = {
  id: "quality-pipeline",
  name: "AI Writing Engine v2",
  version: "2.2.0",
  execute: executeQualityPipeline,
};

export { assembleQualityResult };
