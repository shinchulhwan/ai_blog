import { blogHistoryService } from "@/modules/history";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export interface HistoryEngineOutput {
  historyId: string;
}

export class HistoryEngine extends BaseEngine<HistoryEngineOutput> {
  readonly id = "history" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    if (context.state.historyId) {
      return true;
    }

    return Boolean(context.state.result?.selectedTitle);
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<HistoryEngineOutput> {
    if (context.state.historyId) {
      return { historyId: context.state.historyId };
    }

    const record = await blogHistoryService.saveFromBlogResult(
      input.keyword,
      context.state.result!,
      "READY",
      context.workflow.projectId,
    );

    this.registerRollback(context, async () => {
      await blogHistoryService.delete(record.id);
    });

    context.state.historyId = record.id;
    return { historyId: record.id };
  }
}

export const historyEngine = new HistoryEngine();
