import type OpenAI from "openai";
import { formatResearchContext } from "@/modules/research";
import type { ResearchRecord } from "@/types/research";
import type { SeoIntelligenceResult } from "@/lib/schemas/seo-intelligence.schema";
import { answerPriorityService } from "./answer-priority.service";
import { articleStructureService } from "./article-structure.service";
import { ctaPlacementService } from "./cta-placement.service";
import { faqGenerationService } from "./faq-generation.service";
import { purchaseStageService } from "./purchase-stage.service";
import { searchIntentService } from "./search-intent.service";
import { seoValidationService } from "./seo-validation.service";
import { tableOfContentsService } from "./table-of-contents.service";
import { titleCandidatesService } from "./title-candidates.service";

export interface SeoIntelligenceInput {
  keyword: string;
  research: ResearchRecord;
  customPrompt?: string;
}

export class SeoIntelligenceEngine {
  async execute(
    client: OpenAI,
    input: SeoIntelligenceInput,
  ): Promise<SeoIntelligenceResult> {
    const researchContext = formatResearchContext(input.research);
    const base = {
      keyword: input.keyword,
      researchContext,
      customPrompt: input.customPrompt,
    };

    const searchIntent = await searchIntentService.analyze(client, base);

    const answerPriority = await answerPriorityService.analyze(client, {
      ...base,
      searchIntent,
    });

    const purchaseStage = await purchaseStageService.analyze(client, {
      ...base,
      searchIntent,
      answerPriority,
    });

    const articleStructure = await articleStructureService.generate(client, {
      ...base,
      searchIntent,
      answerPriority,
      purchaseStage,
    });

    const titleCandidates = await titleCandidatesService.generate(client, {
      ...base,
      searchIntent,
      purchaseStage,
      articleStructure,
    });

    const tableOfContents = await tableOfContentsService.generate(client, {
      keyword: input.keyword,
      articleStructure,
      titleCandidates,
      customPrompt: input.customPrompt,
    });

    const ctaPlacement = await ctaPlacementService.decide(client, {
      keyword: input.keyword,
      purchaseStage,
      articleStructure,
      tableOfContents,
      customPrompt: input.customPrompt,
    });

    const faq = await faqGenerationService.generate(client, {
      ...base,
      searchIntent,
      answerPriority,
      purchaseStage,
    });

    const partialResult = {
      searchIntent,
      answerPriority,
      purchaseStage,
      articleStructure,
      titleCandidates,
      tableOfContents,
      ctaPlacement,
      faq,
    };

    const validation = await seoValidationService.validate(client, {
      keyword: input.keyword,
      result: partialResult,
    });

    return { ...partialResult, validation };
  }
}

export const seoIntelligenceEngine = new SeoIntelligenceEngine();
