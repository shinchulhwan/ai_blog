import type { PublishPackage } from "@/modules/publishing/types/publish-package.types";
import type { NaverManagerContext } from "../managers/naver-manager.types";

export type EditorStepId = "title" | "content" | "images" | "tags" | "publish";

export interface EditorStepDefinition {
  id: EditorStepId;
  label: string;
  selectorHint: string;
}

export interface EditorExecutionPlan {
  steps: EditorStepDefinition[];
  publishPackage: PublishPackage;
}

export interface EditorPrepareResult {
  prepared: boolean;
  pageId: string | null;
  plannedSteps: EditorStepId[];
  mock: boolean;
}

export type EditorStepHandler = (
  context: NaverManagerContext,
  publishPackage: PublishPackage,
) => Promise<void>;

export interface EditorOpenResult {
  success: boolean;
  pageId: string | null;
  editorUrl: string | null;
  message: string;
  mock: boolean;
}

export interface EditorReadyResult {
  ready: boolean;
  pageId: string;
  editorUrl: string;
  context: "mainFrame" | "page" | null;
  message: string;
  mock: boolean;
}

export interface EditorValidateResult {
  valid: boolean;
  pageId: string;
  editorUrl: string;
  context: "mainFrame" | "page" | null;
  message: string;
  mock: boolean;
}

export interface EditorAccessResult {
  success: boolean;
  pageId: string | null;
  editorUrl: string | null;
  context: "mainFrame" | "page" | null;
  message: string;
  mock: boolean;
}

export interface EditorInputResult {
  success: boolean;
  pageId: string;
  message: string;
  mock: boolean;
}

export interface EditorContentExpected {
  title: string;
  content: string;
  hashtags: string[];
  minContentLength?: number;
}

export interface EditorContentValidateResult {
  valid: boolean;
  pageId: string;
  titleEntered: boolean;
  contentEntered: boolean;
  contentLengthOk: boolean;
  hashtagsEntered: boolean;
  missingFields: string[];
  actualTitle: string;
  actualContentLength: number;
  expectedContentLength: number;
  message: string;
  mock: boolean;
}

export interface EditorFillResult {
  success: boolean;
  pageId: string;
  title: EditorInputResult;
  content: EditorInputResult;
  hashtags: EditorInputResult;
  validation: EditorContentValidateResult;
  mock: boolean;
}
