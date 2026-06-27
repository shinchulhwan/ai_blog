import { BaseAgent } from "../base/base-agent";
import { publishingService } from "@/modules/publishing";
import type { PublishFromHistoryRequest, PublishOutput } from "@/modules/publishing";
import type { AgentContext } from "../types/agent.types";

class PublishingAgentImpl extends BaseAgent<PublishFromHistoryRequest, PublishOutput> {
  readonly id = "publishing" as const;
  readonly name = "Publishing Agent";

  async execute(input: PublishFromHistoryRequest, context: AgentContext) {
    void context;
    return publishingService.publishFromHistory(input);
  }
}

export const publishingAgent = new PublishingAgentImpl();
