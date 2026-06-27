import {
  applyImageResultToDraft,
  buildBlogResultWithImages,
  imageEngineService,
} from "@/modules/images";
import type { ImageResult } from "@/lib/schemas/image-result.schema";
import type { BodyDraft } from "@/modules/writer";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export interface ImageEngineOutput {
  imageResult: ImageResult;
  draft: BodyDraft;
}

export class ImageEngine extends BaseEngine<ImageEngineOutput> {
  readonly id = "image" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    if (context.state.v3PipelineCompleted && context.state.imageResult) {
      return (
        Boolean(context.state.writingBrainCompleted) &&
        Boolean(context.state.draft?.content) &&
        Boolean(context.state.titleData?.selectedTitle) &&
        Boolean(context.state.validation) &&
        Boolean(context.state.review)
      );
    }

    return (
      Boolean(context.state.writingBrainCompleted) &&
      Boolean(context.state.draft?.content) &&
      Boolean(context.state.titleData?.selectedTitle) &&
      Boolean(context.state.validation) &&
      Boolean(context.state.review)
    );
  }

  async execute(
    input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<ImageEngineOutput> {
    const draft = context.state.draft!;
    const titleData = context.state.titleData!;

    if (context.state.v3PipelineCompleted && context.state.imageResult) {
      context.state.result = buildBlogResultWithImages({
        titleData,
        draft,
        review: context.state.review!,
        validation: context.state.validation!,
      });

      return {
        imageResult: context.state.imageResult,
        draft,
      };
    }

    const serviceInput = {
      keyword: input.keyword,
      title: titleData.selectedTitle,
      content: draft.content,
      metaDescription: draft.metaDescription,
      projectId: context.workflow.projectId,
    };

    const valid = await imageEngineService.validate(serviceInput);

    if (!valid) {
      throw new Error("Image Engine 입력값이 유효하지 않습니다.");
    }

    const { result: imageResult, usedFallback, provider } =
      await imageEngineService.execute(serviceInput);
    const updatedDraft = applyImageResultToDraft(draft, imageResult);

    context.state.draft = updatedDraft;
    context.state.imageResult = imageResult;
    context.state.imageMock = usedFallback || provider === "mock";
    context.state.result = buildBlogResultWithImages({
      titleData,
      draft: updatedDraft,
      review: context.state.review!,
      validation: context.state.validation!,
    });

    return { imageResult, draft: updatedDraft };
  }
}

export const imageEngine = new ImageEngine();
