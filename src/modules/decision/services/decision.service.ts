import type OpenAI from "openai";
import { prisma } from "@/shared/db/prisma";
import { blogHistoryService } from "@/modules/history";
import { createDecisionProvider } from "../providers/decision-provider.factory";
import {
  DecisionReviewError,
  DecisionSkippedError,
} from "../errors/decision.errors";
import type { ResearchRecord } from "@/types/research";
import type {
  DecisionAnalysis,
  DecisionEvaluateInput,
  DecisionHistoryMatch,
  DecisionResult,
  DecisionVerdict,
} from "@/types/decision";

interface DecisionRow {
  id: string;
  keyword: string;
  jobId: string | null;
  researchId: string | null;
  verdict: string;
  verdictReason: string;
  analysis: string;
  createdAt: Date;
}

type DecisionDb = {
  decision: {
    create: (args: {
      data: {
        keyword: string;
        jobId?: string | null;
        researchId?: string | null;
        verdict: string;
        verdictReason: string;
        analysis: string;
      };
    }) => Promise<DecisionRow>;
    findFirst: (args: {
      where: { jobId?: string; keyword?: string };
      orderBy: { createdAt: "desc" };
    }) => Promise<DecisionRow | null>;
  };
};

const db = prisma as unknown as DecisionDb;

function parseAnalysis(value: string): DecisionAnalysis {
  return JSON.parse(value) as DecisionAnalysis;
}

function toDecisionResult(row: DecisionRow): DecisionResult {
  return {
    id: row.id,
    keyword: row.keyword,
    jobId: row.jobId,
    researchId: row.researchId,
    verdict: row.verdict as DecisionVerdict,
    verdictReason: row.verdictReason,
    analysis: parseAnalysis(row.analysis),
    createdAt: row.createdAt.toISOString(),
  };
}

async function findHistoryMatches(
  keyword: string,
  projectId: string,
): Promise<DecisionHistoryMatch[]> {
  const records = await blogHistoryService.list({
    projectId,
    search: keyword.trim(),
    limit: 10,
  });
  return records.map((item) => ({
    id: item.id,
    keyword: item.keyword,
    selectedTitle: item.selectedTitle,
    createdAt: item.createdAt,
  }));
}

export class DecisionService {
  async evaluate(
    client: OpenAI,
    input: {
      keyword: string;
      research: ResearchRecord;
      projectId: string;
      jobId?: string;
    },
  ): Promise<DecisionResult> {
    const historyMatches = await findHistoryMatches(input.keyword, input.projectId);
    const provider = createDecisionProvider("openai");

    const evaluateInput: DecisionEvaluateInput = {
      keyword: input.keyword.trim(),
      researchId: input.research.id,
      researchIntent: input.research.intent,
      relatedKeywords: input.research.relatedKeywords,
      questions: input.research.questions,
      historyMatches,
      jobId: input.jobId,
    };

    const decision = await provider.analyze(evaluateInput, client);

    const row = await prisma.decision.create({
      data: {
        projectId: input.projectId,
        keyword: input.keyword.trim(),
        jobId: input.jobId ?? null,
        researchId: input.research.id,
        verdict: decision.verdict,
        verdictReason: decision.verdictReason,
        analysis: JSON.stringify(decision.analysis),
      },
    });

    return toDecisionResult(row as DecisionRow);
  }

  async enforceVerdict(decision: DecisionResult): Promise<void> {
    if (decision.verdict === "GO") {
      return;
    }

    if (decision.verdict === "SKIP") {
      throw new DecisionSkippedError(decision.verdictReason, decision.id);
    }

    throw new DecisionReviewError(decision.verdictReason, decision.id);
  }

  async getByJobId(jobId: string): Promise<DecisionResult | null> {
    const row = await db.decision.findFirst({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    return row ? toDecisionResult(row) : null;
  }

  async getLatestByKeyword(keyword: string): Promise<DecisionResult | null> {
    const row = await db.decision.findFirst({
      where: { keyword: keyword.trim() },
      orderBy: { createdAt: "desc" },
    });

    return row ? toDecisionResult(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    await prisma.decision.delete({ where: { id } });
  }
}

export const decisionService = new DecisionService();
