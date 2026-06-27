/** Supported prompt pack identifiers */
export type PromptPackId =
  | "seoBlog"
  | "review"
  | "news"
  | "shopping"
  | "localBusiness";

export interface PromptPackMeta {
  id: PromptPackId;
  name: string;
  description: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EvaluationInput {
  keyword: string;
  title: string;
  content: string;
  faq: FaqItem[];
  hashtags: string[];
  metaDescription: string;
}

export interface RevisionInput extends EvaluationInput {
  evaluation: { totalScore: number; feedback: string };
}
