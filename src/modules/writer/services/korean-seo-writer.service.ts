import OpenAI from "openai";
import type { JobProgressUpdate } from "@/types/job";
import { researchService } from "@/modules/research";
import {
  assembleBlogResult,
  evaluateSeoStep,
  generateBodyStep,
  generateTitlesStep,
  rewriteDraftStep,
  SEO_PASSING_SCORE,
  type BlogGenerationResult,
  type GenerateBlogOptions,
} from "./writer-pipeline.steps";

export type { BlogGenerationResult, GenerateBlogOptions };

export async function generateKoreanSeoBlog(
  client: OpenAI,
  keyword: string,
  options?: GenerateBlogOptions,
): Promise<BlogGenerationResult> {
  const onProgress = options?.onProgress;

  const report = async (update: JobProgressUpdate) => {
    if (onProgress) {
      await onProgress(update);
    }
  };

  let research = options?.research;

  if (!research) {
    await report({ status: "GENERATING", progress: 0, stepLabel: "AI 리서치" });
    if (!options?.projectId) {
      throw new Error("프로젝트 ID가 필요합니다.");
    }
    research = await researchService.conductAndSave(client, keyword, options.projectId);
  }

  await report({ status: "GENERATING", progress: 20, stepLabel: "제목 생성" });
  const titleData = await generateTitlesStep(client, keyword, research);

  await report({ status: "GENERATING", progress: 40, stepLabel: "본문 작성" });
  let draft = await generateBodyStep(client, keyword, titleData);

  await report({ status: "GENERATING", progress: 60, stepLabel: "SEO 메타데이터" });
  let evaluation = await evaluateSeoStep(client, keyword, titleData.selectedTitle, draft);

  if (evaluation.totalScore < SEO_PASSING_SCORE) {
    await report({
      status: "GENERATING_IMAGES",
      progress: 80,
      stepLabel: "이미지 프롬프트 재생성",
    });

    draft = await rewriteDraftStep(
      client,
      keyword,
      titleData.selectedTitle,
      draft,
      evaluation,
    );

    evaluation = await evaluateSeoStep(client, keyword, titleData.selectedTitle, draft);
  } else {
    await report({
      status: "GENERATING_IMAGES",
      progress: 80,
      stepLabel: "이미지 프롬프트",
    });
  }

  return {
    result: assembleBlogResult(
      titleData.titles,
      titleData.selectedTitle,
      draft,
      evaluation,
    ),
    researchId: research.id,
  };
}
