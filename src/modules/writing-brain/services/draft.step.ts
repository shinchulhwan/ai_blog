import {
  writingBrainDraftSchema,
  type WritingBrainDraft,
} from "@/lib/schemas/writing-brain.schema";
import { formatResearchContext } from "@/modules/research";
import {
  buildSharedContext,
  type BodyDraft,
  type TitleGenerationResult,
} from "@/modules/writer/services/writer-pipeline.steps";
import type { WritingBrainContext, WritingBrainInput, WritingBrainStep } from "../types/writing-brain.types";
import { callWritingBrainStep } from "./writing-brain-ai";

export class DraftStep implements WritingBrainStep<BodyDraft> {
  readonly stepId = "draft" as const;

  async validate(_input: WritingBrainInput, context: WritingBrainContext): Promise<boolean> {
    return Boolean(context.state.outline);
  }

  async execute(input: WritingBrainInput, context: WritingBrainContext): Promise<BodyDraft> {
    const outline = context.state.outline!;
    const researchContext = formatResearchContext(input.research);

    const draftOutput: WritingBrainDraft = await callWritingBrainStep(
      context.workflow.client,
      input.projectId,
      "draft",
      {
        keyword: input.keyword,
        researchContext,
        intent: JSON.stringify(context.state.intent, null, 2),
        organizedResearch: JSON.stringify(context.state.organizedResearch, null, 2),
        outline: JSON.stringify(outline, null, 2),
        selectedTitle: outline.selectedTitle,
        customPrompt: input.customPrompt ?? "",
      },
      writingBrainDraftSchema,
      "writing_brain_draft",
    );

    context.state.draftOutput = draftOutput;

    const titleData: TitleGenerationResult = {
      researchContext,
      keywordAnalysis: {
        coreKeyword: input.keyword,
        relatedKeywords: context.state.organizedResearch!.relatedKeywords,
        searchTrend: "",
        competition: "",
        targetAudience: context.state.intent!.targetAudience,
        summary: context.state.organizedResearch!.summary,
      },
      titles:
        outline.titleCandidates.length >= 10
          ? outline.titleCandidates.slice(0, 10)
          : [
              ...outline.titleCandidates,
              ...Array.from({ length: 10 - outline.titleCandidates.length }, (_, i) =>
                `${outline.selectedTitle} (${i + 1})`,
              ),
            ],
      selectedTitle: outline.selectedTitle,
      searchIntent: {
        primaryIntent: context.state.intent!.searchIntent,
        userGoal: context.state.intent!.contentPurpose,
        userQuestions: context.state.intent!.userQuestions,
        contentAngle: context.state.intent!.contentAngle,
      },
      structure: {
        sections: outline.sections.map((section) => ({
          heading: section.heading,
          purpose: section.purpose,
          keyPoints: section.keyPoints,
        })),
      },
    };

    const sharedContext = buildSharedContext(
      input.keyword,
      outline.selectedTitle,
      researchContext,
      titleData.keywordAnalysis,
      titleData.searchIntent,
      titleData.structure,
    );

    const draft: BodyDraft = {
      sharedContext,
      content: draftOutput.content,
      faq: draftOutput.faq,
      hashtags: draftOutput.hashtags,
      metaDescription: draftOutput.metaDescription,
      imageAssets: {
        representativeImagePrompt: "",
        bodyImagePrompts: ["", "", "", "", ""],
        thumbnailText: "",
        altTags: {
          representative: "",
          body: ["", "", "", "", ""],
        },
        imageFilenames: {
          representative: "",
          body: ["", "", "", "", ""],
        },
      },
    };

    context.state.titleData = titleData;
    context.state.draft = draft;
    return draft;
  }
}

export const draftStep = new DraftStep();
