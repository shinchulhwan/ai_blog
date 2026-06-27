import { BaseAgent } from "../base/base-agent";
import { seoAnalyzerService } from "@/modules/seo";
import type { SeoAnalysis } from "@/modules/seo";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import type { ContentReview } from "@/modules/reviewer";
import type { AgentContext } from "../types/agent.types";

export interface SeoCheckInput {
  keyword: string;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review?: ContentReview;
}

export interface SeoCheckResult {
  analysis: SeoAnalysis;
  passed: boolean;
}

const PASSING_SCORE = 90;

class SeoAgentImpl extends BaseAgent<SeoCheckInput, SeoCheckResult> {
  readonly id = "seo" as const;
  readonly name = "SEO Agent";

  async execute(input: SeoCheckInput, context: AgentContext): Promise<SeoCheckResult> {
    const client = this.requireClient(context);
    const analysis = await seoAnalyzerService.analyzeDraft(client, {
      keyword: input.keyword,
      titleData: input.titleData,
      draft: input.draft,
      review: input.review,
    });

    return {
      analysis,
      passed: analysis.score >= PASSING_SCORE,
    };
  }
}

export const seoAgent = new SeoAgentImpl();
