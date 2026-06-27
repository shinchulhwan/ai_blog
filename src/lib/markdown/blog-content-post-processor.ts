import {
  BANNED_AI_PHRASES,
  BLOG_FAQ_COUNT,
  BLOG_PARAGRAPH_MAX_SENTENCES,
} from "./blog-content-guidelines";

export interface PostProcessBlogContentOptions {
  faq?: { question: string; answer: string }[];
}

const BANNED_REPLACEMENTS: [RegExp, string][] = [
  [/본\s*글에서는\s*/g, ""],
  [/이번\s*글에서는\s*/g, ""],
  [/함께\s*알아보겠습니다\.?\s*/g, ""],
  [/살펴보겠습니다\.?\s*/g, ""],
  [/알아보겠습니다\.?\s*/g, ""],
  [/결론적으로\s*,?\s*/g, ""],
  [/정리하자면\s*,?\s*/g, ""],
  [/마지막으로\s*말씀드리면\s*,?\s*/g, ""],
  [/도움이\s*될\s*것입니다\.?/g, "도움이 됩니다."],
  [/중요한\s*요소입니다\.?/g, "중요한 포인트예요."],
  [/제공합니다\.?/g, "활용할 수 있습니다."],
];

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isStructuralBlock(block: string): boolean {
  const trimmed = block.trim();

  if (!trimmed) {
    return true;
  }

  if (/^#{1,6}\s/.test(trimmed)) {
    return true;
  }

  if (/^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
    return true;
  }

  if (/^-\s\[[ xX]\]/.test(trimmed)) {
    return true;
  }

  if (/^>\s/.test(trimmed)) {
    return true;
  }

  if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
    return true;
  }

  return false;
}

function splitLongParagraph(text: string, maxSentences: number): string {
  const sentences = splitSentences(text);

  if (sentences.length <= maxSentences) {
    return text.trim();
  }

  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += maxSentences) {
    chunks.push(sentences.slice(index, index + maxSentences).join(" "));
  }

  return chunks.join("\n\n");
}

function removeBannedPhrases(text: string): string {
  let result = text;

  for (const [pattern, replacement] of BANNED_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  for (const phrase of BANNED_AI_PHRASES) {
    if (phrase.includes("제공합니다") || phrase.includes("중요한")) {
      continue;
    }
    result = result.replaceAll(phrase, "");
  }

  return result
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeParagraphSpacing(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasFaqSection(content: string): boolean {
  return /##\s*자주\s*묻는\s*질문/i.test(content);
}

function buildFaqSection(faq: { question: string; answer: string }[]): string {
  const items = faq.slice(0, BLOG_FAQ_COUNT).map((item) => {
    const answer = postProcessFaqAnswer(item.answer);
    return `### ${item.question.trim()}\n\n${answer}`;
  });

  return ["## 자주 묻는 질문", ...items].join("\n\n");
}

export function postProcessFaqAnswer(answer: string): string {
  const cleaned = removeBannedPhrases(answer.trim());
  const sentences = splitSentences(cleaned);
  return sentences.slice(0, BLOG_PARAGRAPH_MAX_SENTENCES).join(" ");
}

export function postProcessBlogContent(
  content: string,
  options: PostProcessBlogContentOptions = {},
): string {
  let processed = normalizeParagraphSpacing(content);
  processed = removeBannedPhrases(processed);

  const blocks = processed.split(/\n\n+/);
  const rebuilt = blocks
    .map((block) => {
      if (isStructuralBlock(block)) {
        return block.trim();
      }

      return splitLongParagraph(block.trim(), BLOG_PARAGRAPH_MAX_SENTENCES);
    })
    .filter(Boolean);

  processed = rebuilt.join("\n\n");

  if (options.faq?.length && !hasFaqSection(processed)) {
    processed = `${processed}\n\n${buildFaqSection(options.faq)}`;
  }

  return normalizeParagraphSpacing(processed);
}

export interface PostProcessDraftInput {
  content: string;
  faq: { question: string; answer: string }[];
}

export function postProcessDraftContent<T extends PostProcessDraftInput>(draft: T): T {
  const faq = draft.faq.slice(0, BLOG_FAQ_COUNT).map((item) => ({
    question: item.question.trim(),
    answer: postProcessFaqAnswer(item.answer),
  }));

  const content = postProcessBlogContent(draft.content, { faq });

  return {
    ...draft,
    content,
    faq,
  };
}
