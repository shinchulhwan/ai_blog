import type { Research } from "@prisma/client";
import type OpenAI from "openai";
import { prisma } from "@/shared/db/prisma";
import { createResearchProvider } from "../providers/research-provider.factory";
import type {
  ResearchConductResult,
  ResearchOutlineData,
  ResearchRecord,
} from "@/types/research";

function parseJsonArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseOutline(value: string): ResearchOutlineData {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "coreTopic" in parsed &&
      "searcherNeeds" in parsed &&
      "sections" in parsed
    ) {
      return parsed as ResearchOutlineData;
    }
  } catch {
    // fall through
  }

  return { coreTopic: "", searcherNeeds: "", sections: [] };
}

function toResearchRecord(record: Research): ResearchRecord {
  return {
    id: record.id,
    keyword: record.keyword,
    intent: record.intent,
    relatedKeywords: parseJsonArray(record.relatedKeywords),
    questions: parseJsonArray(record.questions),
    outline: parseOutline(record.outline),
    createdAt: record.createdAt.toISOString(),
  };
}

function serializeConductResult(result: ResearchConductResult) {
  return {
    intent: result.intent,
    relatedKeywords: JSON.stringify(result.relatedKeywords),
    questions: JSON.stringify(result.questions),
    outline: JSON.stringify(result.outline),
  };
}

export function formatResearchContext(research: ResearchRecord): string {
  return [
    `## 검색 의도 분석`,
    research.intent,
    ``,
    `## 핵심 주제`,
    research.outline.coreTopic,
    ``,
    `## 검색자가 원하는 정보`,
    research.outline.searcherNeeds,
    ``,
    `## 연관 키워드 (20개)`,
    research.relatedKeywords.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    ``,
    `## 사용자 질문 (20개)`,
    research.questions.map((item, index) => `${index + 1}. ${item}`).join("\n"),
    ``,
    `## 글 아웃라인`,
    JSON.stringify(research.outline.sections, null, 2),
  ].join("\n");
}

export class ResearchService {
  async conductAndSave(
    client: OpenAI,
    keyword: string,
    projectId: string,
  ): Promise<ResearchRecord> {
    const provider = createResearchProvider("openai");
    const result = await provider.conductResearch(keyword, client);

    const record = await prisma.research.create({
      data: {
        projectId,
        keyword: keyword.trim(),
        ...serializeConductResult(result),
      },
    });

    return toResearchRecord(record);
  }

  async getById(id: string): Promise<ResearchRecord | null> {
    const record = await prisma.research.findUnique({ where: { id } });
    return record ? toResearchRecord(record) : null;
  }

  async findByKeyword(keyword: string, limit = 5): Promise<ResearchRecord[]> {
    const records = await prisma.research.findMany({
      where: { keyword: keyword.trim() },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return records.map(toResearchRecord);
  }

  async deleteById(id: string): Promise<void> {
    await prisma.research.delete({ where: { id } });
  }
}

export const researchService = new ResearchService();
