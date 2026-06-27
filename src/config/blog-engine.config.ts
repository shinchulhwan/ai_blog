/** Blog Engine V3 — enabled by default; set BLOG_ENGINE_V3=false to use Writing Brain only. */
export const BLOG_ENGINE_CONFIG = {
  v3Enabled: process.env.BLOG_ENGINE_V3?.trim().toLowerCase() !== "false",
  passingQualityScore: 95,
  maxQualityRetries: 2,
} as const;
