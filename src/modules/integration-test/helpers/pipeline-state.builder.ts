import {
  coreEngineService,
  type CoreEngineContext,
  type CoreEngineInput,
  type EngineId,
} from "@/modules/core";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import { INTEGRATION_ENGINE_ORDER } from "../types/integration-test.types";

export async function buildContextUpToEngine(
  workflow: WorkflowContext,
  input: CoreEngineInput,
  targetEngine: EngineId,
): Promise<CoreEngineContext> {
  const context: CoreEngineContext = {
    workflow,
    state: {},
    rollbacks: [],
  };

  const targetIndex = INTEGRATION_ENGINE_ORDER.indexOf(targetEngine);

  if (targetIndex <= 0) {
    return context;
  }

  for (let index = 0; index < targetIndex; index += 1) {
    const engineId = INTEGRATION_ENGINE_ORDER[index];
    const engine = coreEngineService.getEngine(engineId);
    const valid = await engine.validate(input, context);

    if (!valid) {
      throw new Error(`${engineId} Engine 사전 조건을 충족하지 못했습니다.`);
    }

    await engine.execute(input, context);
  }

  return context;
}

export async function runFullIntegrationPipeline(
  workflow: WorkflowContext,
  input: CoreEngineInput,
  phases = INTEGRATION_ENGINE_ORDER,
) {
  return coreEngineService.run(workflow, {
    ...input,
    phases,
  });
}
