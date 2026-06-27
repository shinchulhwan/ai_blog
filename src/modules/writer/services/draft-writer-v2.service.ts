import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { withJsonOnly } from "@/lib/prompts/shared";
import { draftWriterV2Prompts } from "@/lib/prompts/draftWriterV2";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";
import {
  draftWriterOutputSchema,
  type ContentPlan,
  type IntentAnalysis,
} from "@/lib/schemas/writing-engine-v2.schema";
import { imageAssetsSchema } from "@/lib/schemas/blog-response.schema";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";
import { formatResearchContext } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";
import {
  buildSharedContext,
  type BodyDraft,
  type TitleGenerationResult,
} from "./writer-pipeline.steps";
import { buildTitleDataFromDraft } from "./writing-engine-v2.helpers";

export interface WriteDraftV2Input {
  keyword: string;
  research: ResearchRecord;
  intent: IntentAnalysis;
  plan: ContentPlan;
  seoIntelligence?: SeoIntelligenceResult;
  selectedTitle?: string;
  customPrompt?: string;
}

export interface WriterDraftV2Result {
  titleData: TitleGenerationResult;
  draft: BodyDraft;
}

export async function writeDraftV2(
  client: OpenAI,
  input: WriteDraftV2Input,
): Promise<WriterDraftV2Result> {
  const researchContext = formatResearchContext(input.research);

  const draftOutput = await callStructuredJson(
    client,
    {
      instructions: draftWriterV2Prompts.draftWriterInstructions,
      input: draftWriterV2Prompts.buildDraftWriterInput({
        keyword: input.keyword,
        researchContext,
        intent: input.intent,
        plan: input.plan,
        seoIntelligence: input.seoIntelligence,
        customPrompt: input.customPrompt,
      }),
    },
    draftWriterOutputSchema,
    "draft_writer_v2",
  );

  const selectedTitle =
    input.selectedTitle ??
    input.seoIntelligence?.titleCandidates.selectedTitle ??
    input.plan.suggestedTitles[0];

  const titleData = buildTitleDataFromDraft(
    input.keyword,
    researchContext,
    input.intent,
    input.plan,
    selectedTitle,
  );

  const sharedContext = buildSharedContext(
    input.keyword,
    selectedTitle,
    researchContext,
    titleData.keywordAnalysis,
    titleData.searchIntent,
    titleData.structure,
  );

  const imageAssets = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.imageAssetsInstructions),
      input: `${sharedContext}\n\n메타디스크립션: ${draftOutput.metaDescription}\n\n본문:\n${draftOutput.content}`,
    },
    imageAssetsSchema,
    "image_assets",
  );

  const draft: BodyDraft = {
    sharedContext,
    content: draftOutput.content,
    faq: draftOutput.faq,
    hashtags: draftOutput.hashtags,
    metaDescription: draftOutput.metaDescription,
    imageAssets,
  };

  return { titleData, draft };
}
