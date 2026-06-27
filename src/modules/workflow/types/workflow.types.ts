import type OpenAI from "openai";
import type { JobProgressUpdate } from "@/types/job";
import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";

export interface WorkflowContext {
  keyword: string;
  client: OpenAI;
  projectId: string;
  jobId?: string;
  workflowRunId?: string;
  scheduleId?: string;
  scheduleRunId?: string;
  customPrompt?: string;
  onProgress?: (update: JobProgressUpdate) => Promise<void> | void;
}

export interface BlogGenerationWorkflowResult {
  result: BlogFullResponse;
  researchId: string;
  historyId: string;
}

export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  name: string;
  agentId: import("@/modules/agents/types/agent.types").AgentId;
  run: (input: TInput, context: WorkflowContext) => Promise<TOutput>;
}

export interface WorkflowDefinition<TInput, TOutput> {
  id: string;
  name: string;
  version: string;
  execute(input: TInput, context: WorkflowContext): Promise<TOutput>;
}
