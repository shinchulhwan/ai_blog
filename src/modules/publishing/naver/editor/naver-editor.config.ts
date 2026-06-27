/**
 * Naver blog editor URL/selectors — URL 변경 시 이 파일만 수정합니다.
 */
export const NAVER_EDITOR_WRITE_URL_CANDIDATES = [
  "https://blog.naver.com/PostWriteForm.naver",
  "https://blog.naver.com/GoBlogWrite.naver",
] as const;

export const NAVER_EDITOR_WRITE_URL_PATTERN =
  /postwrite|PostWriteForm|GoBlogWrite|Redirect=Write/i;

export const NAVER_EDITOR_ROOT_SELECTORS = [
  "#mainFrame",
  ".se-main-container",
  ".se-title-text",
  ".se-documentTitle",
  ".se-text-paragraph",
  "iframe[name='mainFrame']",
] as const;

export const NAVER_EDITOR_DEBUG_DIR = "debug";

export function resolveNaverBlogId(): string | null {
  const blogId = process.env.NAVER_USERNAME?.trim();
  return blogId || null;
}

export function buildNaverEditorWriteUrlCandidates(blogId?: string | null): string[] {
  const resolvedBlogId = blogId ?? resolveNaverBlogId();

  if (!resolvedBlogId) {
    return [...NAVER_EDITOR_WRITE_URL_CANDIDATES];
  }

  return [
    `https://blog.naver.com/${resolvedBlogId}?Redirect=Write&categoryNo=0`,
    `https://blog.naver.com/PostWriteForm.naver?blogId=${resolvedBlogId}&Redirect=Write&redirect=Write&widgetTypeCall=true&noTrackingCode=true&directAccess=false`,
    `https://blog.naver.com/${resolvedBlogId}?Redirect=Write&categoryNo=0&directAccess=true`,
    `https://blog.naver.com/${resolvedBlogId}/postwrite`,
    `https://blog.naver.com/GoBlogWrite.naver?blogId=${resolvedBlogId}`,
    ...NAVER_EDITOR_WRITE_URL_CANDIDATES.map(
      (url) => `${url}?blogId=${resolvedBlogId}`,
    ),
  ];
}

export function getPrimaryEditorWriteUrl(blogId?: string | null): string {
  return buildNaverEditorWriteUrlCandidates(blogId)[0]!;
}
