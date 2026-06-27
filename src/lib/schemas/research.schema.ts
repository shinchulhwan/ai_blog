import { z } from "zod";

export const researchOutlineSectionSchema = z.object({
  heading: z.string().min(1),
  purpose: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1),
});

export const researchOutlineDataSchema = z.object({
  coreTopic: z.string().min(1),
  searcherNeeds: z.string().min(1),
  sections: z.array(researchOutlineSectionSchema).min(3),
});

/** OpenAI structured research output */
export const researchAiSchema = z.object({
  intent: z.string().min(1),
  coreTopic: z.string().min(1),
  relatedKeywords: z.array(z.string().min(1)).length(20),
  questions: z.array(z.string().min(1)).length(20),
  searcherNeeds: z.string().min(1),
  outline: z.object({
    sections: z.array(researchOutlineSectionSchema).min(3),
  }),
});

export type ResearchAiResponse = z.infer<typeof researchAiSchema>;
