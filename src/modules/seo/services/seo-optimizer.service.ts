import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { withJsonOnly } from "@/lib/prompts/shared";
import { seoOptimizerPrompts } from "@/lib/prompts/seoOptimizer";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";
import {
  seoOptimizerOutputSchema,
  type IntentAnalysis,
  type SeoOptimizerOutput,
} from "@/lib/schemas/writing-engine-v2.schema";
import { imageAssetsSchema } from "@/lib/schemas/blog-response.schema";
import type { BodyDraft } from "@/modules/writer";

export interface OptimizeSeoInput {
  keyword: string;
  title: string;
  draft: BodyDraft;
  intent: IntentAnalysis;
}

export interface SeoOptimizerResult {
  output: SeoOptimizerOutput;
  draft: BodyDraft;
}

export class SeoOptimizerService {
  async optimizeSeo(
    client: OpenAI,
    input: OptimizeSeoInput,
  ): Promise<SeoOptimizerResult> {
    const optimized: SeoOptimizerOutput = await callStructuredJson(
      client,
      {
        instructions: seoOptimizerPrompts.seoOptimizerInstructions,
        input: seoOptimizerPrompts.buildSeoOptimizerInput({
          keyword: input.keyword,
          title: input.title,
          content: input.draft.content,
          faq: input.draft.faq,
          hashtags: input.draft.hashtags,
          metaDescription: input.draft.metaDescription,
          intent: input.intent,
        }),
      },
      seoOptimizerOutputSchema,
      "seo_optimizer",
    );

    const imageAssets = await callStructuredJson(
      client,
      {
        instructions: withJsonOnly(seoBlogPrompts.imageAssetsInstructions),
        input: `${input.draft.sharedContext}\n\n메타디스크립션: ${optimized.metaDescription}\n\n본문:\n${optimized.content}`,
      },
      imageAssetsSchema,
      "image_assets",
    );

    const draft: BodyDraft = {
      ...input.draft,
      content: optimized.content,
      faq: optimized.faq,
      hashtags: optimized.hashtags,
      metaDescription: optimized.metaDescription,
      imageAssets,
    };

    return { output: optimized, draft };
  }
}

export const seoOptimizerService = new SeoOptimizerService();
