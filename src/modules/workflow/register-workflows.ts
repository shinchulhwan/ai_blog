import { workflowEngine } from "./engine/workflow-engine";
import {
  autoPublishWorkflow,
  blogGenerationWorkflow,
} from "./workflows/auto-publish.workflow";
import { qualityPipelineWorkflow } from "./workflows/quality-pipeline.workflow";
import { integrationTestWorkflow } from "@/modules/integration-test/workflows/integration-test.workflow";
import { e2eWorkflowTestWorkflow } from "@/modules/integration-test/workflows/e2e-workflow-test.workflow";

let registered = false;

export function registerWorkflows(): void {
  if (registered) {
    return;
  }

  workflowEngine.register(autoPublishWorkflow);
  workflowEngine.register(blogGenerationWorkflow);
  workflowEngine.register(qualityPipelineWorkflow);
  workflowEngine.register(integrationTestWorkflow);
  workflowEngine.register(e2eWorkflowTestWorkflow);
  registered = true;
}

registerWorkflows();
