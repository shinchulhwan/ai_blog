import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { EditorStepId } from "../editor/editor.types";

export interface NaverPublishingPreparationResult {
  success: boolean;
  mock: boolean;
  historyId: string;
  publishPackage: PublishPackage;
  sessionId: string | null;
  browserId: string | null;
  pageId: string | null;
  editorPrepared: boolean;
  plannedEditorSteps: EditorStepId[];
  loggedIn: boolean;
  loginPageUrl: string | null;
  browserHealthy: boolean;
  message: string;
  preparedAt: string;
}
