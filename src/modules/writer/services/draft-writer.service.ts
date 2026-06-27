import type OpenAI from "openai";
import type { ResearchRecord } from "@/types/research";
import {
  generateBodyStep,
  generateTitlesStep,
  type BodyDraft,
  type TitleGenerationResult,
} from "./writer-pipeline.steps";

export type { BodyDraft, TitleGenerationResult };

export interface WriterDraftResult {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
}

/** Writer — 리서치 기반 초안 작성 */
export async function writeDraft(
  client: OpenAI,
  keyword: string,
  research: ResearchRecord,
): Promise<WriterDraftResult> {
  const titleData = await generateTitlesStep(client, keyword, research);
  const draft = await generateBodyStep(client, keyword, titleData);
  return { titleData, draft };
}
