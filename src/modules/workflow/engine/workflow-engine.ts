import type {
  WorkflowContext,
  WorkflowDefinition,
} from "../types/workflow.types";

/**
 * Workflow Engine — AI Content OS의 모든 모듈을 연결하는 오케스트레이터
 */
export class WorkflowEngine {
  private readonly workflows = new Map<
    string,
    WorkflowDefinition<unknown, unknown>
  >();

  register<TInput, TOutput>(
    workflow: WorkflowDefinition<TInput, TOutput>,
  ): void {
    this.workflows.set(
      workflow.id,
      workflow as WorkflowDefinition<unknown, unknown>,
    );
  }

  async run<TInput, TOutput>(
    workflowId: string,
    input: TInput,
    context: WorkflowContext,
  ): Promise<TOutput> {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`워크플로를 찾을 수 없습니다: ${workflowId}`);
    }

    return workflow.execute(input, context) as Promise<TOutput>;
  }

  has(workflowId: string): boolean {
    return this.workflows.has(workflowId);
  }

  list(): string[] {
    return Array.from(this.workflows.keys());
  }
}

export const workflowEngine = new WorkflowEngine();
