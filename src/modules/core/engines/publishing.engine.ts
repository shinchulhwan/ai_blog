import { publishingEngineService } from "@/modules/publishing";
import type { PublishPackageResult } from "@/modules/publishing";
import { blogHistoryService } from "@/modules/history";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";
import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";

export interface PublishingEngineOutput {
  publishPackage: PublishPackage;
  packageResult: PublishPackageResult;
  historyId: string;
}

/** Publishing Engine — Browser Automation (PublishPackage + Naver login page) */
export class PublishingEngine extends BaseEngine<PublishingEngineOutput> {
  readonly id = "publishing" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    return publishingEngineService.validate({
      keyword: _input.keyword,
      projectId: context.workflow.projectId,
      writingBrainCompleted: Boolean(context.state.writingBrainCompleted),
      hasResult: Boolean(context.state.result),
      hasImageResult: Boolean(context.state.imageResult),
    });
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<PublishingEngineOutput> {
    const output = await publishingEngineService.execute({
      keyword: input.keyword,
      projectId: context.workflow.projectId,
      titleData: context.state.titleData!,
      draft: context.state.draft!,
      imageResult: context.state.imageResult!,
      result: context.state.result!,
      historyId: context.state.historyId,
    });

    this.registerRollback(context, async () => {
      await blogHistoryService.delete(output.historyId);
    });

    context.state.publishPackage = output.publishPackage;
    context.state.historyId = output.historyId;
    context.state.publishMock = output.naverPreparation.mock;
    context.state.publishOutput = {
      platform: "naver",
      historyId: output.historyId,
      externalId: `naver-browser-${output.historyId}`,
      url: output.naverPreparation.loginPageUrl ?? "https://nid.naver.com/nidlogin.login",
      publishedAt: new Date(),
      mock: output.naverPreparation.mock,
    };

    return output;
  }
}

export const publishingEngine = new PublishingEngine();
