import { e2eWorkflowTestService } from "../services/e2e-workflow-test.service";
import type { E2eWorkflowTestResult } from "../types/e2e-workflow.types";
import type { WorkflowDefinition } from "@/modules/workflow/types/workflow.types";

export const e2eWorkflowTestWorkflow: WorkflowDefinition<void, E2eWorkflowTestResult> = {
  id: "e2e-workflow-test",
  name: "End-to-End Workflow Test",
  version: "1.0.0",

  async execute() {
    return e2eWorkflowTestService.run();
  },
};
