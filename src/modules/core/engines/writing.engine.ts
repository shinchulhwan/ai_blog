import { writingBrainEngine } from "@/modules/writing-brain";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export interface WritingEngineOutput {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
}

export class WritingEngine extends BaseEngine<WritingEngineOutput> {
  readonly id = "writing" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    return Boolean(context.state.research?.id) && Boolean(context.state.decision?.id);
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<WritingEngineOutput> {
    const research = context.state.research!;
    const { workflow } = context;

    const brainResult = await writingBrainEngine.execute(workflow, {
      keyword: input.keyword,
      research,
      projectId: workflow.projectId,
      customPrompt: workflow.customPrompt,
    });

    const { state } = brainResult;

    context.state.intent = state.intent
      ? {
          searchIntent: state.intent.searchIntent,
          targetAudience: state.intent.targetAudience,
          contentPurpose: state.intent.contentPurpose,
          userQuestions: state.intent.userQuestions,
          contentAngle: state.intent.contentAngle,
          summary: state.intent.summary,
        }
      : undefined;

    context.state.titleData = state.titleData;
    context.state.draft = state.draft;
    context.state.validation = state.validation
      ? {
          qualityScore: state.validation.qualityScore,
          passed: state.validation.passed,
          criteria: state.validation.criteria,
          issues: state.validation.issues,
          summary: state.validation.summary,
          needsRewrite: state.validation.needsRewrite,
        }
      : undefined;

    context.state.review = state.qualityReview
      ? {
          logic: state.qualityReview.logic,
          accuracy: state.qualityReview.logic,
          flow: state.qualityReview.flow,
          duplication: state.qualityReview.duplication,
          seo: state.qualityReview.seo,
          ctr: state.qualityReview.seo,
          readability: state.qualityReview.readability,
          totalScore: state.qualityReview.totalScore,
          issues: state.qualityReview.issues.map(
            (issue: { category: string; description: string; severity: string }) => ({
              category: issue.category,
              description: issue.description,
              severity: issue.severity as "low" | "medium" | "high",
            }),
          ),
          summary: state.qualityReview.summary,
        }
      : undefined;

    context.state.writingBrainCompleted = true;

    return {
      titleData: state.titleData!,
      draft: state.draft!,
    };
  }
}

export const writingEngine = new WritingEngine();
