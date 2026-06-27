import { BaseAgent } from "../base/base-agent";
import { researchService } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";
import type { AgentContext } from "../types/agent.types";

class ResearchAgentImpl extends BaseAgent<string, ResearchRecord> {
  readonly id = "research" as const;
  readonly name = "Research Agent";

  async execute(keyword: string, context: AgentContext) {
    const client = this.requireClient(context);
    return researchService.conductAndSave(client, keyword, context.projectId);
  }
}

export const researchAgent = new ResearchAgentImpl();
