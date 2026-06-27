import { prisma } from "@/shared/db/prisma";
import type { ProjectPromptRecord } from "@/types/project";

export type WritingBrainPromptStep =
  | "intent-analysis"
  | "research"
  | "outline"
  | "draft"
  | "quality-review"
  | "rewrite"
  | "final-validation"
  | "image-assets";

const WRITING_BRAIN_STEPS: { key: WritingBrainPromptStep; label: string }[] = [
  { key: "intent-analysis", label: "검색 의도 분석" },
  { key: "research", label: "핵심 정보 정리" },
  { key: "outline", label: "목차 생성" },
  { key: "draft", label: "초안 작성" },
  { key: "quality-review", label: "품질 검토" },
  { key: "rewrite", label: "부분 재작성" },
  { key: "final-validation", label: "최종 검증" },
  { key: "image-assets", label: "이미지 에셋" },
];

function stepPromptName(step: WritingBrainPromptStep): string {
  return `writing-brain/${step}`;
}

function toRecord(row: {
  id: string;
  projectId: string;
  name: string;
  description: string;
  systemInstructions: string;
  userTemplate: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProjectPromptRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    systemInstructions: row.systemInstructions,
    userTemplate: row.userTemplate,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function renderPromptTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");
}

export class PromptRepository {
  async getStepPrompt(
    projectId: string,
    step: WritingBrainPromptStep,
  ): Promise<ProjectPromptRecord> {
    await this.ensureWritingBrainPrompts(projectId);

    const record = await prisma.projectPrompt.findFirst({
      where: { projectId, name: stepPromptName(step) },
    });

    if (!record) {
      throw new Error(`Writing Brain 프롬프트를 찾을 수 없습니다: ${step}`);
    }

    return toRecord(record);
  }

  async ensureWritingBrainPrompts(projectId: string): Promise<void> {
    const existing = await prisma.projectPrompt.findMany({
      where: { projectId, name: { startsWith: "writing-brain/" } },
    });

    if (existing.length >= WRITING_BRAIN_STEPS.length) {
      return;
    }

    const defaultPrompt = await prisma.projectPrompt.findFirst({
      where: { projectId, isDefault: true },
    });

    if (!defaultPrompt) {
      throw new Error("프로젝트 기본 프롬프트가 없습니다.");
    }

    const existingNames = new Set(existing.map((row) => row.name));

    for (const { key, label } of WRITING_BRAIN_STEPS) {
      const name = stepPromptName(key);

      if (existingNames.has(name)) {
        continue;
      }

      await prisma.projectPrompt.create({
        data: {
          projectId,
          name,
          description: `Writing Brain — ${label}`,
          systemInstructions: `${defaultPrompt.systemInstructions}\n\n[Writing Brain 단계: ${label}]`,
          userTemplate: defaultPrompt.userTemplate,
          isDefault: false,
        },
      });
    }
  }

  async seedWritingBrainPromptsForProject(projectId: string): Promise<void> {
    await this.ensureWritingBrainPrompts(projectId);
  }
}

export const promptRepository = new PromptRepository();
