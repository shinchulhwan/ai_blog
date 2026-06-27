import { researchService } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";
import { completeDecisionEvaluation } from "./decision.engine";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export class ResearchEngine extends BaseEngine<ResearchRecord> {
  readonly id = "research" as const;

  async validate(input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    return Boolean(input.keyword.trim()) && Boolean(context.workflow.projectId);
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<ResearchRecord> {
    let research = context.state.research;

    if (!research && input.research) {
      research = input.research;
      context.state.research = research;
    }

    if (!research) {
      research = await researchService.conductAndSave(
        context.workflow.client,
        input.keyword,
        context.workflow.projectId,
      );

      this.registerRollback(context, async () => {
        await researchService.deleteById(research!.id);
      });

      context.state.research = research;
    }

    if (context.state.decisionPending || !context.state.decision) {
      await completeDecisionEvaluation(input, context);
    }

    return research;
  }
}

export const researchEngine = new ResearchEngine();
