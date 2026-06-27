import type { BlogFullResponse } from "@/lib/schemas/blog-response.schema";

export function formatBlogMarkdown(blog: BlogFullResponse): string {
  const lines: string[] = [
    `# ${blog.selectedTitle}`,
    "",
    `> ${blog.metaDescription}`,
    "",
    `**썸네일 문구:** ${blog.thumbnailText}`,
    "",
    blog.content,
    "",
    "## FAQ",
    "",
    ...blog.faq.flatMap((item) => [
      `### ${item.question}`,
      "",
      item.answer,
      "",
    ]),
    "## Hashtags",
    "",
    blog.hashtags.map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)).join(" "),
    "",
    "## Images",
    "",
    "### 대표 이미지",
    "",
    `- **Prompt:** ${blog.representativeImagePrompt}`,
    `- **ALT:** ${blog.altTags.representative}`,
    `- **Filename:** ${blog.imageFilenames.representative}`,
    "",
    "### 본문 이미지",
    "",
    ...blog.bodyImagePrompts.flatMap((prompt, index) => [
      `#### Image ${index + 1}`,
      "",
      `- **Prompt:** ${prompt}`,
      `- **ALT:** ${blog.altTags.body[index]}`,
      `- **Filename:** ${blog.imageFilenames.body[index]}`,
      "",
    ]),
    "---",
    "",
    `**SEO Score:** ${blog.seoScore}/100`,
    "",
    "| 항목 | 점수 |",
    "|------|------|",
    `| 제목 매력도 | ${blog.review.title}/20 |`,
    `| SEO | ${blog.review.seo}/20 |`,
    `| 가독성 | ${blog.review.readability}/20 |`,
    `| 자연스러운 문체 | ${blog.review.humanWriting}/20 |`,
    `| 중복 표현 | ${blog.review.duplicates}/20 |`,
  ];

  return lines.join("\n");
}

export function buildBlogFilename(keyword: string, date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const safeKeyword = keyword
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return `${yyyy}-${mm}-${dd}-${safeKeyword}.md`;
}
