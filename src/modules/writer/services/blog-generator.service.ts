import type { BlogPostAiResponse, BlogGenerationOptions } from "@/types/blog";
import { seoBlogPrompts } from "@/lib/prompts/seoBlog";
import { AI_CONFIG } from "@/config/ai.config";
import { ValidationError } from "@/lib/errors";
import { blogPostAiSchema } from "@/lib/schemas/blog-response.schema";
import { createAIProvider } from "@/lib/openai/provider.factory";
import { promptService } from "@/modules/prompt/services/prompt.service";
import type { AIProviderType } from "@/types/ai";

export class BlogGeneratorService {
  async generate(options: BlogGenerationOptions): Promise<BlogPostAiResponse> {
    const keyword = options.keyword?.trim();

    if (!keyword) {
      throw new ValidationError("키워드를 입력해 주세요.");
    }

    if (keyword.length < 2) {
      throw new ValidationError("키워드는 2자 이상 입력해 주세요.");
    }

    if (keyword.length > 200) {
      throw new ValidationError("키워드는 200자 이하로 입력해 주세요.");
    }

    const template = options.promptTemplateId
      ? await promptService.getById(options.promptTemplateId)
      : await promptService.getDefault();

    if (!template) {
      throw new ValidationError("프롬프트 템플릿을 찾을 수 없습니다.");
    }

    const provider = createAIProvider(
      options.provider as AIProviderType | undefined,
    );

    const response = await provider.generateStructured({
      instructions: template.systemInstructions,
      input: seoBlogPrompts.buildUserPrompt(keyword, template.userTemplate),
      temperature: AI_CONFIG.blogGeneration.temperature,
      schema: blogPostAiSchema,
      schemaName: "korean_seo_blog_post",
    });

    return {
      title: response.parsed.title,
      description: response.parsed.description,
      content: response.parsed.content,
      hashtags: response.parsed.hashtags,
    };
  }
}

export const blogGeneratorService = new BlogGeneratorService();
