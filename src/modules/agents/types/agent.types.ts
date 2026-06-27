import type OpenAI from "openai";

export type AgentId =
  | "research"
  | "writer"
  | "seo"
  | "images"
  | "publishing"
  | "history"
  | "analytics";

export interface AgentContext {
  keyword: string;
  client: OpenAI;
  projectId: string;
  jobId?: string;
  researchId?: string;
  historyId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResult<T = unknown> {
  agentId: AgentId;
  success: boolean;
  data?: T;
  error?: string;
}

export interface Agent<TInput = unknown, TOutput = unknown> {
  readonly id: AgentId;
  readonly name: string;
  execute(input: TInput, context: AgentContext): Promise<TOutput>;
}
