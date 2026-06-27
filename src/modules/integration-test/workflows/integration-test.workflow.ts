import type { WorkflowDefinition } from "@/modules/workflow/types/workflow.types";
import { integrationTestEngineService } from "../services/integration-test-engine.service";
import type { IntegrationTestWorkflowResult } from "../types/integration-test.types";

export const integrationTestWorkflow: WorkflowDefinition<
  void,
  IntegrationTestWorkflowResult
> = {
  id: "integration-test",
  name: "Integration Test",
  version: "1.0.0",

  async execute() {
    return integrationTestEngineService.runAll();
  },
};
