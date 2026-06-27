import type { PublishContent } from "../../types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatHashtags(hashtags: string[]): string {
  return hashtags
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
}

function renderRepresentativeImage(content: PublishContent): string {
  const image = content.images.representative;
  const alt = escapeHtml(image.alt ?? content.title);
  const src = image.url ?? "";
  const promptAttr = image.prompt
    ? ` data-prompt="${escapeHtml(image.prompt)}"`
    : "";

  if (src) {
    return `<p><img src="${escapeHtml(src)}" alt="${alt}"${promptAttr} /></p>`;
  }

  return `<p><img alt="${alt}"${promptAttr} /></p>`;
}

function renderBodyImages(content: PublishContent): string {
  return content.images.body
    .map((image, index) => {
      const alt = escapeHtml(image.alt ?? `${content.title} 본문 이미지 ${index + 1}`);
      const src = image.url ?? "";
      const promptAttr = image.prompt
        ? ` data-prompt="${escapeHtml(image.prompt)}"`
        : "";

      if (src) {
        return `<p><img src="${escapeHtml(src)}" alt="${alt}"${promptAttr} /></p>`;
      }

      return `<p><img alt="${alt}"${promptAttr} /></p>`;
    })
    .join("\n");
}

function renderFaqBlock(faq: PublishContent["faq"]): string {
  return faq
    .map(
      (item) =>
        `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`,
    )
    .join("\n");
}

export function convertPublishContentToNaverHtml(content: PublishContent): string {
  const sections = [
    `<h1>${escapeHtml(content.title)}</h1>`,
    `<p class="meta-description">${escapeHtml(content.metaDescription)}</p>`,
    renderRepresentativeImage(content),
    content.content,
    renderBodyImages(content),
    `<section class="faq">${renderFaqBlock(content.faq)}</section>`,
    `<p class="hashtags">${escapeHtml(formatHashtags(content.hashtags))}</p>`,
  ];

  if (content.images.thumbnailText?.trim()) {
    sections.splice(2, 0, `<p class="thumbnail-text">${escapeHtml(content.images.thumbnailText)}</p>`);
  }

  return sections.filter(Boolean).join("\n");
}
