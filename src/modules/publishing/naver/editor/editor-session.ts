import type { Frame } from "playwright";

export interface EditorSessionState {
  mainFrame: Frame | null;
}

const sessions = new Map<string, EditorSessionState>();

export const EDITOR_FRAME_URL_PATTERN = /PostWriteForm|GoBlogWrite|postwrite/i;

export const editorSession = {
  get(pageId: string): EditorSessionState {
    let session = sessions.get(pageId);

    if (!session) {
      session = { mainFrame: null };
      sessions.set(pageId, session);
    }

    return session;
  },

  setMainFrame(pageId: string, frame: Frame | null): void {
    editorSession.get(pageId).mainFrame = frame;
  },

  clear(pageId: string): void {
    sessions.delete(pageId);
  },
};
