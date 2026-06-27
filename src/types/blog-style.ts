export type BlogWritingStyle =
  | "informational"
  | "blog"
  | "monetization"
  | "review"
  | "news";

export const DEFAULT_BLOG_WRITING_STYLE: BlogWritingStyle = "blog";

export const BLOG_WRITING_STYLE_LABELS: Record<BlogWritingStyle, string> = {
  informational: "정보형",
  blog: "블로그형",
  monetization: "수익형",
  review: "후기형",
  news: "뉴스형",
};

export const BLOG_WRITING_STYLE_DESCRIPTIONS: Record<BlogWritingStyle, string> = {
  informational: "객관적·사실 중심, 정리된 정보 전달",
  blog: "친근한 말투, 공감·질문형 도입",
  monetization: "체류·SEO·CTA·FAQ 강화",
  review: "1인칭 경험담, 장단점 비교",
  news: "5W1H, 핵심 먼저, 간결한 뉴스 톤",
};

export const BLOG_WRITING_STYLE_OPTIONS: {
  value: BlogWritingStyle;
  label: string;
  description: string;
}[] = (
  Object.keys(BLOG_WRITING_STYLE_LABELS) as BlogWritingStyle[]
).map((value) => ({
  value,
  label: BLOG_WRITING_STYLE_LABELS[value],
  description: BLOG_WRITING_STYLE_DESCRIPTIONS[value],
}));
