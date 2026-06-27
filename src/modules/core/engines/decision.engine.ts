import { decisionService } from "@/modules/decision";
import type { DecisionResult } from "@/types/decision";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export async function completeDecisionEvaluation(
  input: CoreEngineInput,
  context: CoreEngineContext,
): Promise<DecisionResult> {
  const research = context.state.research!;

  const decision = await decisionService.evaluate(context.workflow.client, {
    keyword: input.keyword,
    research,
    projectId: context.workflow.projectId,
    jobId: input.jobId ?? context.workflow.jobId,
  });

  context.rollbacks.push({
    engineId: "decision",
    action: async () => {
      await decisionService.deleteById(decision.id);
    },
  });

  await decisionService.enforceVerdict(decision);
  context.state.decision = decision;
  context.state.decisionPending = false;
  return decision;
}

export class DecisionEngine extends BaseEngine<DecisionResult | null> {
  readonly id = "decision" as const;

  async validate(input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    return Boolean(input.keyword.trim()) && Boolean(context.workflow.projectId);
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<DecisionResult | null> {
    if (context.state.decision?.id) {
      return context.state.decision;
    }

    if (context.state.research?.id) {
      return completeDecisionEvaluation(input, context);
    }

    context.state.decisionPending = true;
    return null;
  }
}

export const decisionEngine = new DecisionEngine();
