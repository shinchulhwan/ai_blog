import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { decisionPrompts } from "@/lib/prompts/decision";
import { decisionAiSchema } from "@/lib/schemas/decision.schema";
import type {
  DecisionEvaluateInput,
  DecisionProvider,
} from "@/types/decision";

export class OpenAIDecisionProvider implements DecisionProvider {
  readonly type = "openai" as const;

  async analyze(input: DecisionEvaluateInput, client: OpenAI) {
    const result = await callStructuredJson(
      client,
      {
        instructions: decisionPrompts.decisionInstructions,
        input: decisionPrompts.buildDecisionInput({
          keyword: input.keyword,
          researchIntent: input.researchIntent,
          relatedKeywords: input.relatedKeywords,
          questions: input.questions,
          historyMatches: input.historyMatches,
        }),
      },
      decisionAiSchema,
      "keyword_decision",
    );

    return {
      verdict: result.verdict,
      verdictReason: result.verdictReason,
      analysis: result.analysis,
    };
  }
}
