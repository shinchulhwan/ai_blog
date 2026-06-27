import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { humanizerPrompts } from "@/lib/prompts/humanizer";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";
import { withJsonOnly } from "@/lib/prompts/shared";
import {
  humanizerOutputSchema,
  type HumanizerOutput,
} from "@/lib/schemas/quality-pipeline.schema";
import { imageAssetsSchema } from "@/lib/schemas/blog-response.schema";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ContentReview } from "@/modules/reviewer";
import type { SeoAnalysis } from "@/modules/seo";

type ImageAssets = BodyDraft["imageAssets"];

export interface HumanizeDraftInput {
  keyword: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review: ContentReview;
  seoAnalysis?: SeoAnalysis;
}

async function regenerateImageAssets(
  client: OpenAI,
  sharedContext: string,
  metaDescription: string,
  content: string,
): Promise<ImageAssets> {
  return callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.imageAssetsInstructions),
      input: `${sharedContext}\n\n메타디스크립션: ${metaDescription}\n\n본문:\n${content}`,
    },
    imageAssetsSchema,
    "image_assets",
  );
}

export class HumanizerService {
  async humanizeDraft(
    client: OpenAI,
    input: HumanizeDraftInput,
  ): Promise<BodyDraft> {
    const humanized: HumanizerOutput = await callStructuredJson(
      client,
      {
        instructions: humanizerPrompts.humanizerInstructions,
        input: humanizerPrompts.buildHumanizerInput({
          keyword: input.keyword,
          title: input.titleData.selectedTitle,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
          reviewIssues: input.review.issues.map(
            (issue) => `[${issue.severity}] ${issue.category}: ${issue.description}`,
          ),
          seoImprovements: input.seoAnalysis?.improvements ?? [],
        }),
      },
      humanizerOutputSchema,
      "humanizer_output",
    );

    const imageAssets = await regenerateImageAssets(
      client,
      input.draft.sharedContext,
      humanized.metaDescription,
      humanized.content,
    );

    return {
      ...input.draft,
      content: humanized.content,
      faq: humanized.faq,
      hashtags: humanized.hashtags,
      metaDescription: humanized.metaDescription,
      imageAssets,
    };
  }
}

export const humanizerService = new HumanizerService();
