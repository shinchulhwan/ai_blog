import OpenAI from "openai";
import { projectService } from "@/modules/project";
import { jobService } from "@/modules/workflow";
import { scheduleService } from "@/modules/scheduler";
import type { WorkflowContext } from "@/modules/workflow/types/workflow.types";
import { createMockOpenAIClient } from "./mock-openai-client";
import type { MockOpenAIOptions } from "./mock-openai-client";

export interface IntegrationTestEnvironment {
  projectId: string;
  keyword: string;
  jobId: string;
  scheduleId: string;
  scheduleRunId: string;
  createContext: (options?: MockOpenAIOptions) => WorkflowContext;
  cleanup: () => Promise<void>;
}

export async function createIntegrationTestEnvironment(): Promise<IntegrationTestEnvironment> {
  const suffix = Date.now();
  const keyword = `integration-test-${suffix}`;

  const project = await projectService.create({
    name: `Integration Test ${suffix}`,
    description: "Integration Test Engine 전용 프로젝트",
  });

  const job = await jobService.create(keyword, { projectId: project.id });

  const schedule = await scheduleService.create({
    projectId: project.id,
    title: "Integration Test Schedule",
    keyword,
    scheduledAt: new Date(Date.now() + 60_000).toISOString(),
    recurrence: "ONCE",
  });

  const scheduleRun = await scheduleService.createRun(schedule.id);

  return {
    projectId: project.id,
    keyword,
    jobId: job.id,
    scheduleId: schedule.id,
    scheduleRunId: scheduleRun.id,
    createContext: (options) => ({
      keyword,
      client: createMockOpenAIClient(options),
      projectId: project.id,
      jobId: job.id,
      scheduleId: schedule.id,
      scheduleRunId: scheduleRun.id,
    }),
    cleanup: async () => {
      await projectService.delete(project.id);
    },
  };
}

export function createBareWorkflowContext(
  projectId: string,
  keyword: string,
  client?: OpenAI,
): WorkflowContext {
  return {
    keyword,
    client: client ?? createMockOpenAIClient(),
    projectId,
  };
}
