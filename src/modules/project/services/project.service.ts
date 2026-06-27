import type {
  Project,
  ProjectKnowledge,
  ProjectPrompt,
  ProjectStatus as PrismaProjectStatus,
} from "@prisma/client";
import { prisma } from "@/shared/db/prisma";
import { promptRepository } from "@/modules/prompt";
import { normalizeServiceError } from "@/lib/errors/normalize-error";
import type {
  CreateProjectInput,
  ProjectFilter,
  ProjectKnowledgeRecord,
  ProjectPromptRecord,
  ProjectRecord,
  UpdateProjectInput,
} from "@/types/project";
import { ProjectInvalidStateError, ProjectNotFoundError } from "../errors/project.errors";

function toProjectRecord(record: Project): ProjectRecord {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    targetAudience: record.targetAudience,
    language: record.language,
    country: record.country,
    status: record.status as ProjectRecord["status"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toPromptRecord(record: ProjectPrompt): ProjectPromptRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    description: record.description,
    systemInstructions: record.systemInstructions,
    userTemplate: record.userTemplate,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toKnowledgeRecord(record: ProjectKnowledge): ProjectKnowledgeRecord {
  return {
    id: record.id,
    projectId: record.projectId,
    title: record.title,
    content: record.content,
    category: record.category,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function seedDefaultPrompt(projectId: string): Promise<void> {
  await prisma.projectPrompt.create({
    data: {
      projectId,
      name: "Korean SEO Blog Post",
      description: "한국어 SEO 최적화 블로그 글 템플릿",
      systemInstructions:
        "당신은 한국어 SEO 블로그 전문가입니다. JSON Schema 형식으로만 응답하세요.",
      userTemplate:
        "키워드: {{keyword}}\n\n리서치:\n{{researchContext}}\n\n{{customPrompt}}",
      isDefault: true,
    },
  });

  await promptRepository.seedWritingBrainPromptsForProject(projectId);
}

export class ProjectService {
  async create(input: CreateProjectInput): Promise<ProjectRecord> {
    try {
      const record = await prisma.project.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() ?? "",
          targetAudience: input.targetAudience?.trim() ?? "",
          language: input.language?.trim() ?? "ko",
          country: input.country?.trim() ?? "KR",
          status: (input.status ?? "ACTIVE") as PrismaProjectStatus,
        },
      });

      await seedDefaultPrompt(record.id);
      return toProjectRecord(record);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async list(filter: ProjectFilter = {}): Promise<ProjectRecord[]> {
    const search = filter.search?.trim();

    const records = await prisma.project.findMany({
      where: {
        ...(filter.status && { status: filter.status as PrismaProjectStatus }),
        ...(search && {
          OR: [{ name: { contains: search } }, { description: { contains: search } }],
        }),
      },
      orderBy: [{ createdAt: "desc" }],
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return records.map(toProjectRecord);
  }

  async getById(id: string): Promise<ProjectRecord | null> {
    const record = await prisma.project.findUnique({ where: { id } });
    return record ? toProjectRecord(record) : null;
  }

  async requireById(id: string): Promise<ProjectRecord> {
    const record = await this.getById(id);

    if (!record) {
      throw new ProjectNotFoundError(id);
    }

    return record;
  }

  async requireActive(id: string): Promise<ProjectRecord> {
    const record = await this.requireById(id);

    if (record.status !== "ACTIVE") {
      throw new ProjectInvalidStateError("활성 프로젝트만 사용할 수 있습니다.");
    }

    return record;
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectRecord> {
    await this.requireById(id);

    try {
      const record = await prisma.project.update({
        where: { id },
        data: {
          ...(input.name !== undefined && { name: input.name.trim() }),
          ...(input.description !== undefined && { description: input.description.trim() }),
          ...(input.targetAudience !== undefined && {
            targetAudience: input.targetAudience.trim(),
          }),
          ...(input.language !== undefined && { language: input.language.trim() }),
          ...(input.country !== undefined && { country: input.country.trim() }),
          ...(input.status !== undefined && {
            status: input.status as PrismaProjectStatus,
          }),
        },
      });

      return toProjectRecord(record);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async delete(id: string): Promise<void> {
    await this.requireById(id);

    try {
      await prisma.project.delete({ where: { id } });
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async duplicate(id: string): Promise<ProjectRecord> {
    const source = await this.requireById(id);

    const [prompts, knowledge] = await Promise.all([
      prisma.projectPrompt.findMany({ where: { projectId: id } }),
      prisma.projectKnowledge.findMany({ where: { projectId: id } }),
    ]);

    try {
      const record = await prisma.project.create({
        data: {
          name: `${source.name} (복제)`,
          description: source.description,
          targetAudience: source.targetAudience,
          language: source.language,
          country: source.country,
          status: "ACTIVE",
        },
      });

      if (prompts.length > 0) {
        await prisma.projectPrompt.createMany({
          data: prompts.map((item) => ({
            projectId: record.id,
            name: item.name,
            description: item.description,
            systemInstructions: item.systemInstructions,
            userTemplate: item.userTemplate,
            isDefault: item.isDefault,
          })),
        });
      } else {
        await seedDefaultPrompt(record.id);
      }

      if (knowledge.length > 0) {
        await prisma.projectKnowledge.createMany({
          data: knowledge.map((item) => ({
            projectId: record.id,
            title: item.title,
            content: item.content,
            category: item.category,
          })),
        });
      }

      return toProjectRecord(record);
    } catch (error) {
      throw normalizeServiceError(error);
    }
  }

  async listPrompts(projectId: string): Promise<ProjectPromptRecord[]> {
    await this.requireById(projectId);

    const records = await prisma.projectPrompt.findMany({
      where: { projectId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return records.map(toPromptRecord);
  }

  async listKnowledge(projectId: string): Promise<ProjectKnowledgeRecord[]> {
    await this.requireById(projectId);

    const records = await prisma.projectKnowledge.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return records.map(toKnowledgeRecord);
  }

  async resolveProjectId(projectId?: string): Promise<string> {
    if (projectId) {
      return (await this.requireById(projectId)).id;
    }

    const fallback = await prisma.project.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });

    if (!fallback) {
      throw new ProjectNotFoundError();
    }

    return fallback.id;
  }
}

export const projectService = new ProjectService();
