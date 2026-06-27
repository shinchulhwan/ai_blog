export type DecisionVerdict = "GO" | "REVIEW" | "SKIP";

export type DecisionProviderType =
  | "openai"
  | "tavily"
  | "google_search"
  | "serpapi";

export interface DecisionHistoryMatch {
  id: string;
  keyword: string;
  selectedTitle: string;
  createdAt: string;
}

export interface DecisionAnalysis {
  worthWriting: { score: number; reason: string };
  searchIntent: string;
  competition: { level: "low" | "medium" | "high"; reason: string };
  blogTrafficPotential: { possible: boolean; reason: string };
  adValue: { level: "low" | "medium" | "high"; reason: string };
  profitability: { level: "low" | "medium" | "high"; reason: string };
  historyDuplicate: {
    isDuplicate: boolean;
    matchedHistoryId: string | null;
    reason: string;
  };
  summary: string;
}

export interface DecisionResult {
  id: string;
  keyword: string;
  jobId: string | null;
  researchId: string | null;
  verdict: DecisionVerdict;
  verdictReason: string;
  analysis: DecisionAnalysis;
  createdAt: string;
}

export interface DecisionEvaluateInput {
  keyword: string;
  researchId: string;
  researchIntent: string;
  relatedKeywords: string[];
  questions: string[];
  historyMatches: DecisionHistoryMatch[];
  jobId?: string;
}

export interface DecisionProvider {
  readonly type: DecisionProviderType;
  analyze(
    input: DecisionEvaluateInput,
    client: import("openai").default,
  ): Promise<{ verdict: DecisionVerdict; verdictReason: string; analysis: DecisionAnalysis }>;
}
