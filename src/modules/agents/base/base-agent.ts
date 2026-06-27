import type { Agent, AgentContext, AgentId } from "../types/agent.types";

export abstract class BaseAgent<TInput, TOutput> implements Agent<TInput, TOutput> {
  abstract readonly id: AgentId;
  abstract readonly name: string;

  abstract execute(input: TInput, context: AgentContext): Promise<TOutput>;

  protected requireClient(context: AgentContext) {
    if (!context.client) {
      throw new Error(`${this.name} 에이전트: OpenAI 클라이언트가 필요합니다.`);
    }
    return context.client;
  }
}
