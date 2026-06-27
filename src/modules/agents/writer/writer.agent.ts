import { BaseAgent } from "../base/base-agent";
import {
  generateKoreanSeoBlog,
  type BlogGenerationResult,
} from "@/modules/writer";
import type { ResearchRecord } from "@/types/research";
import type { JobProgressUpdate } from "@/types/job";
import type { AgentContext } from "../types/agent.types";

export interface WriterAgentInput {
  research: ResearchRecord;
  onProgress?: (update: JobProgressUpdate) => void | Promise<void>;
}

class WriterAgentImpl extends BaseAgent<WriterAgentInput, BlogGenerationResult> {
  readonly id = "writer" as const;
  readonly name = "Writer Agent";

  async execute(input: WriterAgentInput, context: AgentContext) {
    const client = this.requireClient(context);
    return generateKoreanSeoBlog(client, context.keyword, {
      research: input.research,
      onProgress: input.onProgress,
    });
  }
}

export const writerAgent = new WriterAgentImpl();
