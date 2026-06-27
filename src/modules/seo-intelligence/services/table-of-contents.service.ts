import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
import {
  seoTableOfContentsSchema,
  type SeoArticleStructure,
  type SeoTableOfContents,
  type SeoTitleCandidates,
} from "@/lib/schemas/seo-intelligence.schema";

export interface TableOfContentsStepInput {
  keyword: string;
  articleStructure: SeoArticleStructure;
  titleCandidates: SeoTitleCandidates;
  customPrompt?: string;
}

export class TableOfContentsService {
  async generate(
    client: OpenAI,
    input: TableOfContentsStepInput,
  ): Promise<SeoTableOfContents> {
    return callStructuredJson(
      client,
      {
        instructions: seoIntelligencePrompts.seoTableOfContentsInstructions,
        input: seoIntelligencePrompts.buildSeoTableOfContentsInput(
          input.keyword,
          input.articleStructure,
          input.titleCandidates,
          input.customPrompt,
        ),
      },
      seoTableOfContentsSchema,
      "seo_table_of_contents",
    );
  }
}

export const tableOfContentsService = new TableOfContentsService();
