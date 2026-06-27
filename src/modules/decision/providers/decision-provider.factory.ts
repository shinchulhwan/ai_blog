import { NotImplementedError } from "@/lib/errors";
import { OpenAIDecisionProvider } from "./openai.decision-provider";
import type { DecisionProvider, DecisionProviderType } from "@/types/decision";

export function createDecisionProvider(
  providerType: DecisionProviderType = "openai",
): DecisionProvider {
  switch (providerType) {
    case "openai":
      return new OpenAIDecisionProvider();
    case "tavily":
      throw new NotImplementedError("Tavily Decision");
    case "google_search":
      throw new NotImplementedError("Google Search Decision");
    case "serpapi":
      throw new NotImplementedError("SerpAPI Decision");
    default:
      throw new NotImplementedError(`Decision provider: ${String(providerType)}`);
  }
}

export function getAvailableDecisionProviders(): DecisionProviderType[] {
  return ["openai"];
}

export function getPlannedDecisionProviders(): DecisionProviderType[] {
  return ["openai", "tavily", "google_search", "serpapi"];
}
