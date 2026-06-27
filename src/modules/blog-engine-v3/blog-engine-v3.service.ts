import type OpenAI from "openai";
import { BLOG_ENGINE_CONFIG } from "@/config/blog-engine.config";
import { callStructuredJson } from "@/lib/openai/structured-request";
import {
  buildV3DraftInput,
  buildV3FinalQualityInput,
  buildV3HumanRewriteInput,
  buildV3ImageCountInput,
  buildV3ReadabilityInput,
  buildV3SeoAnalysisInput,
  v3DraftV1Instructions,
  v3FinalQualityInstructions,
  v3FinalRewriteInstructions,
  v3HumanRewriteInstructions,
  v3ImageCountInstructions,
  v3ReadabilityInstructions,
  v3SeoAnalysisInstructions,
} from "@/lib/prompts/blog-engine-v3.prompts";
import { insertImagesIntoMarkdown } from "@/lib/markdown/image-inserter";
import { postProcessDraftContent } from "@/lib/markdown/blog-content-post-processor";
import {
  v3DraftV1Schema,
  v3FinalQualitySchema,
  v3HumanRewriteSchema,
  v3ImageCountSchema,
  v3ReadabilitySchema,
  v3SeoAnalysisSchema,
  resolveBodyImageCountByLength,
  type V3SeoAnalysis,
} from "@/lib/schemas/blog-engine-v3.schema";
import type { ImageResult } from "@/lib/schemas/image-result.schema";
import type { FinalValidation } from "@/lib/schemas/writing-engine-v2.schema";
import type { IntentAnalysis } from "@/lib/schemas/writing-engine-v2.schema";
import { formatResearchContext } from "@/modules/research";
import { seoOptimizerService } from "@/modules/seo/services/seo-optimizer.service";
import { dynamicImageService } from "@/modules/images/services/dynamic-image.service";
import type { ContentReview } from "@/modules/reviewer";
import type { BodyDraft, TitleGenerationResult } from "@/modules/writer";
import { buildSharedContext } from "@/modules/writer/services/writer-pipeline.steps";
import type { ResearchRecord } from "@/types/research";
import type { JobProgressUpdate } from "@/types/job";
import { BLOG_ENGINE_V3_STEPS } from "./blog-engine-v3.steps";

export interface BlogEngineV3Input {
  keyword: string;
  research: ResearchRecord;
  projectId: string;
  customPrompt?: string;
  onProgress?: (update: JobProgressUpdate) => Promise<void> | void;
}

export interface BlogEngineV3Result {
  seoAnalysis: V3SeoAnalysis;
  titleData: TitleGenerationResult;
  draft: BodyDraft;
  review: ContentReview;
  validation: FinalValidation;
  imageResult: ImageResult;
  v3Completed: true;
}

async function reportProgress(
  onProgress: BlogEngineV3Input["onProgress"],
  stepKey: keyof typeof BLOG_ENGINE_V3_STEPS,
): Promise<void> {
  const step = BLOG_ENGINE_V3_STEPS[stepKey];

  if (!onProgress) {
    return;
  }

  await onProgress({
    status: "status" in step && step.status ? step.status : "GENERATING",
    progress: step.progress,
    stepLabel: step.label,
  });
}

function toIntentAnalysis(seo: V3SeoAnalysis): IntentAnalysis {
  return {
    searchIntent: seo.searchIntent,
    targetAudience: seo.targetAudience,
    contentPurpose: seo.contentAngle,
    userQuestions: seo.userQuestions,
    contentAngle: seo.contentAngle,
    summary: seo.summary,
  };
}

function buildTitleData(
  keyword: string,
  researchContext: string,
  seo: V3SeoAnalysis,
  draft: { titles: string[]; selectedTitle: string },
): TitleGenerationResult {
  return {
    researchContext,
    keywordAnalysis: {
      coreKeyword: seo.coreKeyword,
      relatedKeywords: seo.relatedKeywords,
      searchTrend: "",
      competition: "",
      targetAudience: seo.targetAudience,
      summary: seo.summary,
    },
    titles: draft.titles,
    selectedTitle: draft.selectedTitle,
    searchIntent: {
      primaryIntent: seo.searchIntent,
      userGoal: seo.summary,
      userQuestions: seo.userQuestions,
      contentAngle: seo.contentAngle,
    },
    structure: {
      sections: [],
    },
  };
}

function buildSyntheticReview(validation: FinalValidation): ContentReview {
  return {
    logic: validation.criteria.contentQuality ?? 18,
    accuracy: 18,
    flow: validation.criteria.readability ?? 18,
    duplication: 18,
    seo: validation.criteria.seo ?? 18,
    ctr: 18,
    readability: validation.criteria.readability ?? 18,
    totalScore: validation.qualityScore,
    issues: validation.issues.map((description) => ({
      category: "quality",
      description,
      severity: "medium" as const,
    })),
    summary: validation.summary,
  };
}

export class BlogEngineV3Service {
  async execute(client: OpenAI, input: BlogEngineV3Input): Promise<BlogEngineV3Result> {
    const researchContext = formatResearchContext(input.research);
    const stylePrompt = input.customPrompt ?? "";

    await reportProgress(input.onProgress, "seoAnalysis");
    const seoAnalysis = await callStructuredJson(
      client,
      {
        instructions: v3SeoAnalysisInstructions,
        input: buildV3SeoAnalysisInput(input.keyword, researchContext),
      },
      v3SeoAnalysisSchema,
      "v3_seo_analysis",
    );

    await reportProgress(input.onProgress, "draftV1");
    const draftV1 = await callStructuredJson(
      client,
      {
        instructions: v3DraftV1Instructions,
        input: buildV3DraftInput(
          input.keyword,
          JSON.stringify(seoAnalysis, null, 2),
          stylePrompt,
        ),
      },
      v3DraftV1Schema,
      "v3_draft_v1",
    );

    await reportProgress(input.onProgress, "humanRewrite");
    const humanized = await callStructuredJson(
      client,
      {
        instructions: v3HumanRewriteInstructions,
        input: buildV3HumanRewriteInput(
          input.keyword,
          draftV1.selectedTitle,
          draftV1.content,
        ),
      },
      v3HumanRewriteSchema,
      "v3_human_rewrite",
    );

    await reportProgress(input.onProgress, "readability");
    const readable = await callStructuredJson(
      client,
      {
        instructions: v3ReadabilityInstructions,
        input: buildV3ReadabilityInput(draftV1.selectedTitle, humanized.content),
      },
      v3ReadabilitySchema,
      "v3_readability",
    );

    const intent = toIntentAnalysis(seoAnalysis);
    let titleData = buildTitleData(input.keyword, researchContext, seoAnalysis, draftV1);

    let draft: BodyDraft = {
      sharedContext: buildSharedContext(
        input.keyword,
        draftV1.selectedTitle,
        researchContext,
        titleData.keywordAnalysis,
        titleData.searchIntent,
        titleData.structure,
      ),
      content: readable.content,
      faq: readable.faq,
      hashtags: humanized.hashtags,
      metaDescription: readable.metaDescription,
      imageAssets: {
        representativeImagePrompt: "",
        bodyImagePrompts: [],
        thumbnailText: "",
        altTags: { representative: "", body: [] },
        imageFilenames: { representative: "", body: [] },
      },
    };

    draft = postProcessDraftContent(draft);

    await reportProgress(input.onProgress, "seoOptimize");
    const optimized = await seoOptimizerService.optimizeSeo(client, {
      keyword: input.keyword,
      title: draftV1.selectedTitle,
      draft,
      intent,
    });

    draft = postProcessDraftContent(optimized.draft);
    titleData = {
      ...titleData,
      selectedTitle: optimized.output.selectedTitle,
      titles: optimized.output.titles,
    };

    const charCount = draft.content.length;
    const countRange = resolveBodyImageCountByLength(charCount);

    await reportProgress(input.onProgress, "imageCount");
    const imagePlan = await callStructuredJson(
      client,
      {
        instructions: v3ImageCountInstructions,
        input: `${buildV3ImageCountInput(draftV1.selectedTitle, draft.content, charCount)}\n\n권장 본문 이미지: ${countRange.min}~${countRange.max}장`,
      },
      v3ImageCountSchema,
      "v3_image_count",
    );

    const bodyCount = Math.min(
      Math.max(imagePlan.bodyImageCount, countRange.min),
      countRange.max,
    );

    const prompts = imagePlan.sectionPrompts.slice(0, bodyCount);
    while (prompts.length < bodyCount) {
      const fallback = imagePlan.sectionPrompts[prompts.length - 1] ?? imagePlan.sectionPrompts[0];
      if (fallback) {
        prompts.push(fallback);
      } else {
        break;
      }
    }

    await reportProgress(input.onProgress, "imageGenerate");
    const imageResult = await dynamicImageService.generate({
      keyword: input.keyword,
      title: titleData.selectedTitle,
      content: draft.content,
      metaDescription: draft.metaDescription,
      projectId: input.projectId,
      coverPrompt: imagePlan.coverPrompt,
      bodyPrompts: prompts.map((item) => item.englishPrompt),
      thumbnailText: imagePlan.thumbnailText,
    });

    await reportProgress(input.onProgress, "imageInsert");
    const placements = prompts.map((section, index) => ({
      sectionHeading: section.sectionHeading,
      imageUrl: imageResult.contentImageUrls[index] ?? imageResult.contentImageUrls[0]!,
      altText: imageResult.altTexts[index + 1] ?? `${input.keyword} 본문 이미지 ${index + 1}`,
      placement: section.placement,
    }));

    draft = {
      ...draft,
      content: insertImagesIntoMarkdown(
        draft.content,
        {
          url: imageResult.coverImageUrl,
          altText: imageResult.altTexts[0] ?? `${input.keyword} 대표 이미지`,
        },
        placements,
      ),
      imageAssets: {
        representativeImagePrompt: imageResult.coverPrompt,
        bodyImagePrompts: imageResult.contentImages,
        thumbnailText: imageResult.thumbnailText,
        altTags: {
          representative: imageResult.altTexts[0] ?? "",
          body: imageResult.altTexts.slice(1),
        },
        imageFilenames: {
          representative: imageResult.fileNames[0] ?? "",
          body: imageResult.fileNames.slice(1),
        },
      },
    };

    let validation = await this.runFinalQuality(client, input.keyword, titleData.selectedTitle, draft, bodyCount);
    let rewriteAttempts = 0;

    while (
      !validation.passed &&
      validation.qualityScore < BLOG_ENGINE_CONFIG.passingQualityScore &&
      rewriteAttempts < BLOG_ENGINE_CONFIG.maxQualityRetries
    ) {
      await reportProgress(input.onProgress, "finalQuality");
      const revised = await callStructuredJson(
        client,
        {
          instructions: v3FinalRewriteInstructions,
          input: buildV3FinalQualityInput({
            keyword: input.keyword,
            title: titleData.selectedTitle,
            content: draft.content,
            metaDescription: draft.metaDescription,
            imageCount: bodyCount,
            issues: validation.issues,
          }),
        },
        v3ReadabilitySchema,
        "v3_final_rewrite",
      );

      draft = postProcessDraftContent({
        ...draft,
        content: revised.content,
        faq: revised.faq,
        metaDescription: revised.metaDescription,
      });

      validation = await this.runFinalQuality(
        client,
        input.keyword,
        titleData.selectedTitle,
        draft,
        bodyCount,
      );
      rewriteAttempts += 1;
    }

    await reportProgress(input.onProgress, "complete");

    const finalValidation: FinalValidation = {
      qualityScore: validation.qualityScore,
      passed: validation.passed || validation.qualityScore >= BLOG_ENGINE_CONFIG.passingQualityScore,
      criteria: {
        intentAlignment: validation.criteria.seo,
        contentQuality: validation.criteria.structure,
        readability: validation.criteria.readability,
        seo: validation.criteria.seo,
        humanWriting: validation.criteria.aiTone,
      },
      issues: validation.issues,
      summary: validation.summary,
      needsRewrite: validation.needsRewrite,
    };

    return {
      seoAnalysis,
      titleData,
      draft,
      review: buildSyntheticReview(finalValidation),
      validation: finalValidation,
      imageResult,
      v3Completed: true,
    };
  }

  private async runFinalQuality(
    client: OpenAI,
    keyword: string,
    title: string,
    draft: BodyDraft,
    imageCount: number,
  ) {
    return callStructuredJson(
      client,
      {
        instructions: v3FinalQualityInstructions,
        input: buildV3FinalQualityInput({
          keyword,
          title,
          content: draft.content,
          metaDescription: draft.metaDescription,
          imageCount,
        }),
      },
      v3FinalQualitySchema,
      "v3_final_quality",
    );
  }
}

export const blogEngineV3Service = new BlogEngineV3Service();
