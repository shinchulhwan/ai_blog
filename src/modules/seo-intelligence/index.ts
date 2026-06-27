export {
  SeoIntelligenceEngine,
  seoIntelligenceEngine,
} from "./services/seo-intelligence.engine";
export type { SeoIntelligenceInput } from "./services/seo-intelligence.engine";

export { searchIntentService, SearchIntentService } from "./services/search-intent.service";
export { answerPriorityService, AnswerPriorityService } from "./services/answer-priority.service";
export { purchaseStageService, PurchaseStageService } from "./services/purchase-stage.service";
export { articleStructureService, ArticleStructureService } from "./services/article-structure.service";
export { titleCandidatesService, TitleCandidatesService } from "./services/title-candidates.service";
export { tableOfContentsService, TableOfContentsService } from "./services/table-of-contents.service";
export { ctaPlacementService, CtaPlacementService } from "./services/cta-placement.service";
export { faqGenerationService, FaqGenerationService } from "./services/faq-generation.service";
export { seoValidationService, SeoValidationService } from "./services/seo-validation.service";

export {
  mapSeoIntelligenceToIntent,
  mapSeoIntelligenceToPlan,
  mapSeoIntelligenceToWriterContext,
} from "./services/seo-intelligence.mapper";

export type {
  SeoIntelligenceResult,
  RealSearchIntent,
  AnswerPriority,
  PurchaseStage,
  SeoArticleStructure,
  SeoTitleCandidates,
  SeoTableOfContents,
  CtaPlacement,
  SeoFaqGeneration,
  SeoIntelligenceValidation,
} from "@/lib/schemas/seo-intelligence.schema";

export { SEO_INTELLIGENCE_PASSING_SCORE } from "@/lib/schemas/seo-intelligence.schema";
export { seoIntelligencePrompts } from "@/lib/prompts/seoIntelligence";
