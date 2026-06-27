export interface MockEditorInputState {
  title: string;
  content: string;
  contentPlain: string;
  hashtags: string[];
}

const mockEditorInputs = new Map<string, MockEditorInputState>();

export function getMockEditorInput(pageId: string): MockEditorInputState | null {
  return mockEditorInputs.get(pageId) ?? null;
}

export function setMockEditorTitle(pageId: string, title: string): void {
  const existing = mockEditorInputs.get(pageId) ?? {
    title: "",
    content: "",
    contentPlain: "",
    hashtags: [],
  };

  existing.title = title;
  mockEditorInputs.set(pageId, existing);
}

export function setMockEditorContent(
  pageId: string,
  content: string,
  contentPlain: string,
): void {
  const existing = mockEditorInputs.get(pageId) ?? {
    title: "",
    content: "",
    contentPlain: "",
    hashtags: [],
  };

  existing.content = content;
  existing.contentPlain = contentPlain;
  mockEditorInputs.set(pageId, existing);
}

export function setMockEditorHashtags(pageId: string, hashtags: string[]): void {
  const existing = mockEditorInputs.get(pageId) ?? {
    title: "",
    content: "",
    contentPlain: "",
    hashtags: [],
  };

  existing.hashtags = hashtags;
  mockEditorInputs.set(pageId, existing);
}

export function clearMockEditorInput(pageId: string): void {
  mockEditorInputs.delete(pageId);
}
