import { BaseAgent } from "../base/base-agent";
import { imageEngineService } from "@/modules/images/services/image-engine.service";
import type { GeneratedImage, ImageGenerationRequest } from "@/types/image";
import type { AgentContext } from "../types/agent.types";

class ImageAgentImpl extends BaseAgent<ImageGenerationRequest, GeneratedImage> {
  readonly id = "images" as const;
  readonly name = "Image Agent";

  async execute(input: ImageGenerationRequest, context: AgentContext) {
    const { result } = await imageEngineService.execute({
      keyword: input.prompt.slice(0, 80),
      title: input.prompt.slice(0, 120),
      content: input.prompt,
      metaDescription: input.prompt.slice(0, 160),
      projectId: context.projectId ?? "default",
    });

    return {
      id: result.coverImageUrl ?? "cover",
      url: result.coverImageUrl ?? result.thumbnailUrl ?? "",
      prompt: input.prompt,
      provider: "image-engine",
      createdAt: new Date(),
    };
  }
}

export const imageAgent = new ImageAgentImpl();
