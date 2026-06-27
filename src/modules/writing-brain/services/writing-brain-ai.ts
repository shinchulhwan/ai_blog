import type OpenAI from "openai";
import { callStructuredJson } from "@/lib/openai/structured-request";
import { withJsonOnly } from "@/lib/prompts/shared";
import { getWritingBrainStepExtensions } from "@/lib/prompts/writing-brain-extensions";
import {
  promptRepository,
  renderPromptTemplate,
  type WritingBrainPromptStep,
} from "@/modules/prompt";
import type { z } from "zod";

export async function callWritingBrainStep<T>(
  client: OpenAI,
  projectId: string,
  step: WritingBrainPromptStep,
  variables: Record<string, string>,
  schema: z.ZodType<T>,
  schemaName: string,
): Promise<T> {
  const prompt = await promptRepository.getStepPrompt(projectId, step);
  const stepExtensions = getWritingBrainStepExtensions(step);
  const instructions = stepExtensions
    ? `${prompt.systemInstructions}\n\n${stepExtensions}`
    : prompt.systemInstructions;

  return callStructuredJson(
    client,
    {
      instructions: withJsonOnly(instructions),
      input: renderPromptTemplate(prompt.userTemplate, variables),
    },
    schema,
    schemaName,
  );
}
