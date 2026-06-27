export interface ImagePlacement {
  sectionHeading: string;
  imageUrl: string;
  altText: string;
  placement: "after_intro" | "after_h2" | "before_closing";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function insertAfterHeading(content: string, heading: string, markdown: string): string {
  const pattern = new RegExp(`(^##\\s+${escapeRegex(heading)}\\s*$)`, "m");
  const match = pattern.exec(content);

  if (!match || match.index === undefined) {
    return content;
  }

  const insertAt = match.index + match[0].length;
  return `${content.slice(0, insertAt)}\n\n${markdown}\n${content.slice(insertAt)}`;
}

function insertAfterIntro(content: string, markdown: string): string {
  const firstH2 = content.search(/^##\s+/m);

  if (firstH2 === -1) {
    return `${content}\n\n${markdown}`;
  }

  const intro = content.slice(0, firstH2).trim();
  const rest = content.slice(firstH2);

  return `${intro}\n\n${markdown}\n\n${rest}`;
}

function insertBeforeClosing(content: string, markdown: string): string {
  const faqIndex = content.search(/^##\s*자주\s*묻는\s*질문/im);

  if (faqIndex !== -1) {
    return `${content.slice(0, faqIndex).trim()}\n\n${markdown}\n\n${content.slice(faqIndex)}`;
  }

  return `${content.trim()}\n\n${markdown}`;
}

function toImageMarkdown(altText: string, imageUrl: string): string {
  return `![${altText}](${imageUrl})`;
}

export function insertImagesIntoMarkdown(
  content: string,
  coverImage: { url: string; altText: string },
  placements: ImagePlacement[],
): string {
  let result = insertAfterIntro(
    content,
    toImageMarkdown(coverImage.altText, coverImage.url),
  );

  const h2Placements = placements.filter((item) => item.placement === "after_h2");
  const closingPlacements = placements.filter((item) => item.placement === "before_closing");

  for (const placement of h2Placements) {
    const markdown = toImageMarkdown(placement.altText, placement.imageUrl);
    const updated = insertAfterHeading(result, placement.sectionHeading, markdown);

    if (updated !== result) {
      result = updated;
    } else {
      result = `${result.trim()}\n\n${markdown}`;
    }
  }

  for (const placement of closingPlacements) {
    const markdown = toImageMarkdown(placement.altText, placement.imageUrl);
    result = insertBeforeClosing(result, markdown);
  }

  return result.replace(/\n{3,}/g, "\n\n").trim();
}
