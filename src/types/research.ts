export type ResearchProviderType =
  | "openai"
  | "tavily"
  | "google_search"
  | "serpapi";

export interface ResearchOutlineSection {
  heading: string;
  purpose: string;
  keyPoints: string[];
}

export interface ResearchOutlineData {
  coreTopic: string;
  searcherNeeds: string;
  sections: ResearchOutlineSection[];
}

export interface ResearchRecord {
  id: string;
  keyword: string;
  intent: string;
  relatedKeywords: string[];
  questions: string[];
  outline: ResearchOutlineData;
  createdAt: string;
}

export interface ResearchConductResult {
  intent: string;
  relatedKeywords: string[];
  questions: string[];
  outline: ResearchOutlineData;
}

export interface ResearchProvider {
  readonly type: ResearchProviderType;
  conductResearch(
    keyword: string,
    client: import("openai").default,
  ): Promise<ResearchConductResult>;
}
