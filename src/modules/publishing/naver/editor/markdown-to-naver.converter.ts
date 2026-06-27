function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function processInlineMarkdown(text: string): string {
  let result = text;

  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_, label, url) =>
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
  );

  result = result.replace(/\*\*([^*]+)\*\*/g, (_, value) => `<b>${escapeHtml(value)}</b>`);
  result = result.replace(/__([^_]+)__/g, (_, value) => `<b>${escapeHtml(value)}</b>`);

  if (!/[<>]/.test(result)) {
    return escapeHtml(result);
  }

  return result;
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function convertMarkdownToNaverHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const parts: string[] = [];
  let inList = false;
  let listTag: "ul" | "ol" = "ul";

  const closeList = () => {
    if (inList) {
      parts.push(`</${listTag}>`);
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);

    if (unordered) {
      if (!inList || listTag !== "ul") {
        closeList();
        parts.push("<ul>");
        inList = true;
        listTag = "ul";
      }

      parts.push(`<li>${processInlineMarkdown(unordered[1])}</li>`);
      continue;
    }

    if (ordered) {
      if (!inList || listTag !== "ol") {
        closeList();
        parts.push("<ol>");
        inList = true;
        listTag = "ol";
      }

      parts.push(`<li>${processInlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    parts.push(`<p>${processInlineMarkdown(trimmed)}</p>`);
  }

  closeList();
  return parts.join("");
}
