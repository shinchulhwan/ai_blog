import { projectService } from "@/modules/project";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import { createMockOpenAIClient } from "./mock-openai-client";
import type { MockOpenAIOptions } from "./mock-openai-client";

export interface E2eTestEnvironment {
  projectId: string;
  keyword: string;
  createContext: (options?: MockOpenAIOptions, jobId?: string) => WorkflowContext;
  cleanup: () => Promise<void>;
}

export async function createE2eTestEnvironment(): Promise<E2eTestEnvironment> {
  const suffix = Date.now();
  const keyword = `e2e-workflow-${suffix}`;

  const project = await projectService.create({
    name: `E2E Workflow Test ${suffix}`,
    description: "End-to-End Workflow Test 전용 프로젝트",
  });

  return {
    projectId: project.id,
    keyword,
    createContext: (options, jobId) => ({
      keyword,
      client: createMockOpenAIClient(options),
      projectId: project.id,
      jobId,
    }),
    cleanup: async () => {
      await projectService.delete(project.id);
    },
  };
}
