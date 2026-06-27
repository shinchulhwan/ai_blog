import type { PromptTemplate } from "@/types/prompt";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";

const DEFAULT_TEMPLATE: PromptTemplate = {
  id: "default-blog",
  name: "Korean SEO Blog Post",
  description: "한국어 SEO 최적화 블로그 글 템플릿",
  systemInstructions: seoBlogPrompts.systemInstructions,
  userTemplate: seoBlogPrompts.userTemplate,
  isDefault: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

/** In-memory prompt store — replace with database in future */
class PromptServiceImpl {
  private templates: Map<string, PromptTemplate> = new Map([
    [DEFAULT_TEMPLATE.id, DEFAULT_TEMPLATE],
  ]);

  async list(): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getById(id: string): Promise<PromptTemplate | null> {
    return this.templates.get(id) ?? null;
  }

  async getDefault(): Promise<PromptTemplate> {
    const templates = await this.list();
    return templates.find((t) => t.isDefault) ?? DEFAULT_TEMPLATE;
  }
}

export const promptService = new PromptServiceImpl();
