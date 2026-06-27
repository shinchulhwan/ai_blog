import type { Agent, AgentId } from "../types/agent.types";
import { historyAgent } from "../history/history.agent";
import { imageAgent } from "../images/image.agent";
import { publishingAgent } from "../publishing/publishing.agent";
import { researchAgent } from "../research/research.agent";
import { seoAgent } from "../seo/seo.agent";
import { writerAgent } from "../writer/writer.agent";

const agents: Record<AgentId, Agent> = {
  research: researchAgent,
  writer: writerAgent,
  seo: seoAgent,
  images: imageAgent,
  publishing: publishingAgent,
  history: historyAgent,
  analytics: {
    id: "analytics",
    name: "Analytics Agent",
    execute: async () => ({ tracked: true }),
  },
};

export class AgentRegistry {
  static get(id: AgentId): Agent {
    const agent = agents[id];
    if (!agent) {
      throw new Error(`등록되지 않은 에이전트: ${id}`);
    }
    return agent;
  }

  static list(): AgentId[] {
    return Object.keys(agents) as AgentId[];
  }
}

export { agents };
