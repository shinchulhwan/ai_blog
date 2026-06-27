import { coreEngineService } from "@/modules/core";
import { keywordService } from "@/modules/keyword";
import { jobService } from "../services/job.service";
import { workflowLogService } from "../services/workflow-log.service";
import { runWorkflowStep } from "../engine/run-workflow-step";
import type {
  AutoPublishState,
  AutoPublishWorkflowResult,
} from "./auto-publish.steps";
import { AUTO_PUBLISH_STEPS } from "./auto-publish.steps";
import type { WorkflowContext, WorkflowDefinition } from "../types/workflow.types";
import { getKoreanErrorMessage } from "@/lib/errors";

export const autoPublishWorkflow: WorkflowDefinition<
  void,
  AutoPublishWorkflowResult
> = {
  id: "auto-publish",
  name: "Auto Publish",
  version: "2.0.0",

  async execute(_input, context: WorkflowContext): Promise<AutoPublishWorkflowResult> {
    const state: AutoPublishState = { keyword: context.keyword };

    const workflowRun = context.jobId
      ? await workflowLogService.startRun({
          projectId: context.projectId,
          jobId: context.jobId,
          workflowId: "auto-publish",
          keyword: context.keyword,
        })
      : null;

    if (workflowRun) {
      context.workflowRunId = workflowRun.id;
    }

    try {
      await runWorkflowStep(context, AUTO_PUBLISH_STEPS.keywordSave, async () => {
        state.keywordRecord = await keywordService.ensureSaved(context.keyword, {
          projectId: context.projectId,
        });
      });

      await runWorkflowStep(context, AUTO_PUBLISH_STEPS.jobCreate, async () => {
        if (context.jobId) {
          const existing = await jobService.getById(context.jobId);
          if (!existing) {
            throw new Error("생성 작업을 찾을 수 없습니다.");
          }
          state.job = existing;
          return;
        }

        state.job = await jobService.create(context.keyword, {
          projectId: context.projectId,
        });
        context.jobId = state.job.id;
      });

      const coreResult = await coreEngineService.run(context, {
        keyword: context.keyword,
        jobId: context.jobId,
      });

      state.research = coreResult.state.research;
      state.titleData = coreResult.state.titleData;
      state.draft = coreResult.state.draft;
      state.result = coreResult.state.result;
      state.historyId = coreResult.state.historyId;
      state.publishOutput = coreResult.state.publishOutput;

      if (!coreResult.state.publishPackage || !coreResult.state.historyId) {
        throw new Error("PublishPackage 생성에 실패했습니다.");
      }

      await runWorkflowStep(context, AUTO_PUBLISH_STEPS.complete, async () => {
        await keywordService.markGenerationCompleted(state.keywordRecord!.id);
      });

      if (workflowRun) {
        await workflowLogService.completeRun(workflowRun.id);
      }

      return {
        result: state.result!,
        researchId: state.research!.id,
        historyId: state.historyId!,
        keywordId: state.keywordRecord!.id,
        jobId: state.job!.id,
        publishOutput: state.publishOutput,
      };
    } catch (error) {
      const message = getKoreanErrorMessage(error);

      if (workflowRun) {
        await workflowLogService.failRun(workflowRun.id, message);
      }

      if (state.keywordRecord?.id) {
        await keywordService.markGenerationFailed(state.keywordRecord.id, message);
      }

      throw error;
    }
  },
};

export const blogGenerationWorkflow: WorkflowDefinition<
  void,
  Pick<AutoPublishWorkflowResult, "result" | "researchId" | "historyId">
> = {
  id: "blog-generation",
  name: "Blog Generation",
  version: "2.0.0",

  async execute(_input, context) {
    const result = await autoPublishWorkflow.execute(undefined, context);
    return {
      result: result.result,
      researchId: result.researchId,
      historyId: result.historyId,
    };
  },
};
