export const APP_CONFIG = {
  name: "AI 블로그 자동 작성기",
  description: "한국형 AI 블로그 자동화 — 작성, SEO, 이미지까지 한곳에서",
  version: "0.2.0",
} as const;

export const API_ROUTES = {
  generate: "/api/generate",
  saveBlog: "/api/blogs/save",
  keywords: "/api/keywords",
  history: "/api/history",
  jobs: "/api/jobs",
  schedules: "/api/schedules",
  projects: "/api/projects",
} as const;

/** Feature flags for future capabilities */
export const FEATURES = {
  promptManagement: false,
  imageGeneration: false,
  blogPublishing: false,
  blogHistory: true,
  jobPipeline: true,
  researchEngine: true,
  keywordManagement: true,
  scheduledPublishing: false,
  multipleProviders: true,
} as const;
