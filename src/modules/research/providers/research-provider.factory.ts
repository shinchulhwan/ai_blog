import { NotImplementedError } from "@/lib/errors";
import { OpenAIResearchProvider } from "./openai.research-provider";
import type { ResearchProvider, ResearchProviderType } from "@/types/research";

export function createResearchProvider(
  providerType: ResearchProviderType = "openai",
): ResearchProvider {
  switch (providerType) {
    case "openai":
      return new OpenAIResearchProvider();
    case "tavily":
      throw new NotImplementedError("Tavily 리서치");
    case "google_search":
      throw new NotImplementedError("Google Search 리서치");
    case "serpapi":
      throw new NotImplementedError("SerpAPI 리서치");
    default:
      throw new NotImplementedError(`Research provider: ${providerType}`);
  }
}

export function getAvailableResearchProviders(): ResearchProviderType[] {
  return ["openai"];
}

export function getPlannedResearchProviders(): ResearchProviderType[] {
  return ["openai", "tavily", "google_search", "serpapi"];
}
