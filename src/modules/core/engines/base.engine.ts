import type { Engine, CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export abstract class BaseEngine<TOutput = unknown>
  implements Engine<CoreEngineInput, TOutput>
{
  abstract readonly id: Engine<CoreEngineInput, TOutput>["id"];

  protected registerRollback(
    context: CoreEngineContext,
    action: () => Promise<void>,
  ): void {
    context.rollbacks.push({ engineId: this.id, action });
  }

  async rollback(context: CoreEngineContext): Promise<void> {
    const actions = context.rollbacks.filter((entry) => entry.engineId === this.id);

    for (const { action } of [...actions].reverse()) {
      try {
        await action();
      } catch {
        // rollback best-effort
      }
    }

    context.rollbacks = context.rollbacks.filter((entry) => entry.engineId !== this.id);
  }

  abstract execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<TOutput>;

  abstract validate(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<boolean>;
}
