import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  AI_PROVIDER: z.enum(["openai", "anthropic", "google"]).default("openai"),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  NEXT_PUBLIC_APP_NAME: z.string().default("AI 블로그 자동 작성기"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  return parsed.data;
}

/** Server-only validated environment variables */
export function getEnv(): Env {
  return validateEnv();
}

/** Client-safe public config */
export function getPublicConfig() {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AI 블로그 자동 작성기",
  };
}
