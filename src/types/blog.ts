export interface BlogPost {
  id: string;
  title: string;
  description: string;
  content: string;
  hashtags: string[];
  keyword: string;
  createdAt: Date;
  provider: string;
  model: string;
}

export interface GenerateBlogRequest {
  keyword: string;
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogReviewScores {
  title: number;
  seo: number;
  readability: number;
  humanWriting: number;
  duplicates: number;
}

/** Full JSON returned from POST /api/generate */
export interface BlogFullJsonResponse {
  titles: string[];
  selectedTitle: string;
  metaDescription: string;
  content: string;
  faq: BlogFaqItem[];
  hashtags: string[];
  imagePrompt: string;
  seoScore: number;
  review: BlogReviewScores;
}

/** JSON returned from POST /api/generate (legacy) */
export interface BlogPostAiResponse {
  title: string;
  description: string;
  content: string;
  hashtags: string[];
}

/** Client state shape used by existing UI components */
export interface GenerateBlogResponse extends BlogPostAiResponse {
  provider: string;
  model: string;
}

export interface BlogGenerationOptions {
  keyword: string;
  promptTemplateId?: string;
  provider?: string;
}
