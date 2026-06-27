import { runWorkflowStep } from "@/modules/workflow/engine/run-workflow-step";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import { CORE_ENGINE_STEPS } from "../core-engine.steps";
import { decisionEngine } from "../engines/decision.engine";
import { historyEngine } from "../engines/history.engine";
import { imageEngine } from "../engines/image.engine";
import { publishingEngine } from "../engines/publishing.engine";
import { qualityEngine } from "../engines/quality.engine";
import { researchEngine } from "../engines/research.engine";
import { schedulerEngine } from "../engines/scheduler.engine";
import { writingEngine } from "../engines/writing.engine";
import type {
  CoreEngineContext,
  CoreEngineInput,
  CoreEngineResult,
  CoreEngineState,
  Engine,
  EngineId,
} from "../types/engine.types";
import { ENGINE_EXECUTION_ORDER } from "../types/engine.types";

const ENGINE_REGISTRY: Record<EngineId, Engine> = {
  decision: decisionEngine,
  research: researchEngine,
  writing: writingEngine,
  quality: qualityEngine,
  image: imageEngine,
  history: historyEngine,
  publishing: publishingEngine,
  scheduler: schedulerEngine,
};

function resolvePhases(phases?: EngineId[]): EngineId[] {
  if (!phases?.length) {
    return ENGINE_EXECUTION_ORDER;
  }

  return phases;
}

export class CoreEngineService {
  private readonly engines = ENGINE_REGISTRY;

  getEngine(id: EngineId): Engine {
    return this.engines[id];
  }

  listEngines(): EngineId[] {
    return ENGINE_EXECUTION_ORDER;
  }

  async run(
    workflow: WorkflowContext,
    input: CoreEngineInput,
  ): Promise<CoreEngineResult> {
    const state: CoreEngineState = {};

    if (input.research) {
      state.research = input.research;
    }

    const context: CoreEngineContext = { workflow, state, rollbacks: [] };
    const phases = resolvePhases(input.phases);
    const enginesExecuted: EngineId[] = [];

    try {
      for (const engineId of phases) {
        const engine = this.engines[engineId];
        const step = CORE_ENGINE_STEPS[engineId];

        await runWorkflowStep(workflow, step, async () => {
          const valid = await engine.validate(input, context);

          if (!valid) {
            throw new Error(`${engineId} Engine 사전 조건을 충족하지 못했습니다.`);
          }

          await engine.execute(input, context);
        });

        enginesExecuted.push(engineId);
      }

      return { state, enginesExecuted };
    } catch (error) {
      for (const engineId of [...enginesExecuted].reverse()) {
        await this.engines[engineId].rollback(context);
      }
      throw error;
    }
  }
}

export const coreEngineService = new CoreEngineService();
