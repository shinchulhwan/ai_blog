import OpenAI from "openai";
import { withJsonOnly } from "@/lib/prompts/shared";
import { reviewPrompts } from "@/lib/prompts/review";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";
import { callStructuredJson } from "@/lib/openai/structured-request";
import type { JobProgressUpdate } from "@/types/job";
import type { ResearchRecord } from "@/types/research";
import {
  articleStructureSchema,
  blogArticleSchema,
  blogEvaluationSchema,
  bodyContentSchema,
  faqGenerationSchema,
  hashtagsGenerationSchema,
  imageAssetsSchema,
  keywordAnalysisSchema,
  metaDescriptionSchema,
  searchIntentSchema,
  titleCandidatesSchema,
  titleSelectionSchema,
  type BlogEvaluation,
  type BlogFullResponse,
} from "@/lib/schemas/blog-response.schema";
import { formatResearchContext } from "@/modules/research";

export const SEO_PASSING_SCORE = 90;

type ImageAssets = Pick<
  BlogFullResponse,
  | "representativeImagePrompt"
  | "bodyImagePrompts"
  | "thumbnailText"
  | "altTags"
  | "imageFilenames"
>;

export interface TitleGenerationResult {
  researchContext: string;
  keywordAnalysis: {
    coreKeyword: string;
    relatedKeywords: string[];
    searchTrend: string;
    competition: string;
    targetAudience: string;
    summary: string;
  };
  titles: string[];
  selectedTitle: string;
  searchIntent: {
    primaryIntent: string;
    userGoal: string;
    userQuestions: string[];
    contentAngle: string;
  };
  structure: {
    sections: {
      heading: string;
      purpose: string;
      keyPoints: string[];
    }[];
  };
}

export interface BodyDraft {
  sharedContext: string;
  content: string;
  faq: BlogFullResponse["faq"];
  hashtags: string[];
  metaDescription: string;
  imageAssets: ImageAssets;
}

export function buildSharedContext(
  keyword: string,
  selectedTitle: string,
  researchContext: string,
  keywordAnalysis: TitleGenerationResult["keywordAnalysis"],
  searchIntent: TitleGenerationResult["searchIntent"],
  structure: TitleGenerationResult["structure"],
): string {
  return `키워드: ${keyword}
선택된 제목: ${selectedTitle}

사전 AI 리서치:
${researchContext}

키워드 분석:
${JSON.stringify(keywordAnalysis, null, 2)}

검색 의도:
${JSON.stringify(searchIntent, null, 2)}

글 구조:
${JSON.stringify(structure, null, 2)}`;
}

function buildReview(evaluation: BlogEvaluation): BlogFullResponse["review"] {
  return {
    title: evaluation.titleAppeal,
    seo: evaluation.seo,
    readability: evaluation.readability,
    humanWriting: evaluation.humanLike,
    duplicates: evaluation.noDuplicateExpressions,
  };
}

async function generateImageAssets(
  client: OpenAI,
  context: string,
): Promise<ImageAssets> {
  return callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.imageAssetsInstructions),
      input: context,
    },
    imageAssetsSchema,
    "image_assets",
  );
}

export async function generateTitlesStep(
  client: OpenAI,
  keyword: string,
  research: ResearchRecord,
): Promise<TitleGenerationResult> {
  const researchContext = formatResearchContext(research);

  const keywordAnalysis = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.keywordAnalysisInstructions),
      input: `키워드: ${keyword}\n\n사전 AI 리서치:\n${researchContext}`,
    },
    keywordAnalysisSchema,
    "keyword_analysis",
  );

  const { titles } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.titleCandidatesInstructions),
      input: `키워드: ${keyword}\n\n사전 AI 리서치:\n${researchContext}\n\n키워드 분석:\n${JSON.stringify(keywordAnalysis, null, 2)}`,
    },
    titleCandidatesSchema,
    "title_candidates",
  );

  const { selectedTitle } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.titleSelectionInstructions),
      input: `키워드: ${keyword}\n\n사전 AI 리서치:\n${researchContext}\n\n키워드 분석:\n${JSON.stringify(keywordAnalysis, null, 2)}\n\n제목 후보:\n${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    },
    titleSelectionSchema,
    "title_selection",
  );

  const searchIntent = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.searchIntentInstructions),
      input: `키워드: ${keyword}\n선택된 제목: ${selectedTitle}\n\n사전 AI 리서치:\n${researchContext}\n\n키워드 분석:\n${JSON.stringify(keywordAnalysis, null, 2)}`,
    },
    searchIntentSchema,
    "search_intent",
  );

  const structure = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.articleStructureInstructions),
      input: `키워드: ${keyword}\n선택된 제목: ${selectedTitle}\n\n사전 AI 리서치:\n${researchContext}\n\n키워드 분석:\n${JSON.stringify(keywordAnalysis, null, 2)}\n\n검색 의도:\n${JSON.stringify(searchIntent, null, 2)}`,
    },
    articleStructureSchema,
    "article_structure",
  );

  return {
    researchContext,
    keywordAnalysis,
    titles,
    selectedTitle,
    searchIntent,
    structure,
  };
}

export async function generateBodyStep(
  client: OpenAI,
  keyword: string,
  titleData: TitleGenerationResult,
): Promise<BodyDraft> {
  const sharedContext = buildSharedContext(
    keyword,
    titleData.selectedTitle,
    titleData.researchContext,
    titleData.keywordAnalysis,
    titleData.searchIntent,
    titleData.structure,
  );

  const { content } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.bodyContentInstructions),
      input: sharedContext,
    },
    bodyContentSchema,
    "body_content",
  );

  const { faq } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.faqGenerationInstructions),
      input: `${sharedContext}\n\n본문:\n${content}`,
    },
    faqGenerationSchema,
    "faq_generation",
  );

  const { hashtags } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.hashtagsInstructions),
      input: `${sharedContext}\n\n본문:\n${content}`,
    },
    hashtagsGenerationSchema,
    "hashtags_generation",
  );

  const { metaDescription } = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(seoBlogPrompts.metaDescriptionInstructions),
      input: `${sharedContext}\n\n본문:\n${content}`,
    },
    metaDescriptionSchema,
    "meta_description",
  );

  const imageAssets = await generateImageAssets(
    client,
    `${sharedContext}\n\n메타디스크립션: ${metaDescription}\n\n본문:\n${content}`,
  );

  return {
    sharedContext,
    content,
    faq,
    hashtags,
    metaDescription,
    imageAssets,
  };
}

export async function evaluateSeoStep(
  client: OpenAI,
  keyword: string,
  selectedTitle: string,
  draft: Pick<BodyDraft, "content" | "faq" | "hashtags" | "metaDescription">,
): Promise<BlogEvaluation> {
  return callStructuredJson(
    client,
    {
      instructions: withJsonOnly(reviewPrompts.evaluationInstructions),
      input: reviewPrompts.buildEvaluationInput({
        keyword,
        title: selectedTitle,
        content: draft.content,
        faq: draft.faq,
        hashtags: draft.hashtags,
        metaDescription: draft.metaDescription,
      }),
    },
    blogEvaluationSchema,
    "blog_evaluation",
  );
}

export async function rewriteDraftStep(
  client: OpenAI,
  keyword: string,
  selectedTitle: string,
  draft: BodyDraft,
  evaluation: BlogEvaluation,
): Promise<BodyDraft> {
  const revised = await callStructuredJson(
    client,
    {
      instructions: withJsonOnly(reviewPrompts.revisionInstructions),
      input: reviewPrompts.buildRevisionInput({
        keyword,
        title: selectedTitle,
        content: draft.content,
        faq: draft.faq,
        hashtags: draft.hashtags,
        metaDescription: draft.metaDescription,
        evaluation,
      }),
    },
    blogArticleSchema,
    "blog_revision",
  );

  const imageAssets = await generateImageAssets(
    client,
    `${draft.sharedContext}\n\n메타디스크립션: ${revised.metaDescription}\n\n수정된 본문:\n${revised.content}`,
  );

  return {
    ...draft,
    content: revised.content,
    faq: revised.faq,
    hashtags: revised.hashtags,
    metaDescription: revised.metaDescription,
    imageAssets,
  };
}

export function assembleBlogResult(
  titles: string[],
  selectedTitle: string,
  draft: BodyDraft,
  evaluation: BlogEvaluation,
): BlogFullResponse {
  return {
    titles,
    selectedTitle,
    metaDescription: draft.metaDescription,
    content: draft.content,
    faq: draft.faq,
    hashtags: draft.hashtags,
    ...draft.imageAssets,
    seoScore: evaluation.totalScore,
    review: buildReview(evaluation),
  };
}

export interface BlogGenerationResult {
  result: BlogFullResponse;
  researchId: string;
}

export interface GenerateBlogOptions {
  onProgress?: (update: JobProgressUpdate) => void | Promise<void>;
  research?: ResearchRecord;
  projectId?: string;
}
