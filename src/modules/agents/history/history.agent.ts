import { BaseAgent } from "../base/base-agent";
import { blogHistoryService } from "@/modules/history";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type { BlogHistoryRecord } from "@/types/history";
import type { AgentContext } from "../types/agent.types";

export interface HistoryAgentInput {
  result: BlogFullResponse;
}

class HistoryAgentImpl extends BaseAgent<HistoryAgentInput, BlogHistoryRecord> {
  readonly id = "history" as const;
  readonly name = "History Agent";

  async execute(input: HistoryAgentInput, context: AgentContext) {
    return blogHistoryService.saveFromBlogResult(
      context.keyword,
      input.result,
      "READY",
      context.projectId,
    );
  }
}

export const historyAgent = new HistoryAgentImpl();
