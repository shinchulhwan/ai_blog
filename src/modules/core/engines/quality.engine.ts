import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";
import type { FinalValidation } from "@/lib/schemas/writing-engine-v2.schema";
import { buildBlogResultWithImages } from "@/modules/images";
import { BaseEngine } from "./base.engine";
import type { CoreEngineContext, CoreEngineInput } from "../types/engine.types";

export interface QualityEngineOutput {
  result: BlogFullResponse;
  validation: FinalValidation;
}

/** Quality Engine — Writing Brain 검증 결과 반영 (부분 실행용) */
export class QualityEngine extends BaseEngine<QualityEngineOutput> {
  readonly id = "quality" as const;

  async validate(_input: CoreEngineInput, context: CoreEngineContext): Promise<boolean> {
    if (context.state.result && context.state.validation && context.state.imageResult) {
      return true;
    }

    return (
      Boolean(context.state.writingBrainCompleted) &&
      Boolean(context.state.draft) &&
      Boolean(context.state.titleData) &&
      Boolean(context.state.validation) &&
      Boolean(context.state.review)
    );
  }

  async execute(
    _input: CoreEngineInput,
    context: CoreEngineContext,
  ): Promise<QualityEngineOutput> {
    if (context.state.result && context.state.validation) {
      return {
        result: context.state.result,
        validation: context.state.validation,
      };
    }

    if (
      context.state.draft &&
      context.state.titleData &&
      context.state.review &&
      context.state.validation
    ) {
      context.state.result = buildBlogResultWithImages({
        titleData: context.state.titleData,
        draft: context.state.draft,
        review: context.state.review,
        validation: context.state.validation,
      });

      return {
        result: context.state.result,
        validation: context.state.validation,
      };
    }

    throw new Error("Writing Brain 품질 검증 데이터가 없습니다.");
  }
}

export const qualityEngine = new QualityEngine();
