/**
 * Naver editor/publish selector registry — 우선순위 순서로 탐색합니다.
 * 구조 변경 시 이 파일만 수정합니다.
 */
export type NaverSelectorKey =
  | "title"
  | "editor"
  | "editorRead"
  | "publishButton"
  | "confirmPublishButton"
  | "tempSaveButton"
  | "tagInput"
  | "tagChip"
  | "popupDismiss"
  | "editorRoot";

export interface NaverSelectorDefinition {
  key: NaverSelectorKey;
  /** 낮을수록 먼저 시도 */
  priority: number;
  selectors: readonly string[];
}

export const NAVER_SELECTOR_REGISTRY: Record<NaverSelectorKey, NaverSelectorDefinition> = {
  title: {
    key: "title",
    priority: 1,
    selectors: [
      ".se-title-text .se-text-paragraph",
      ".se-documentTitle .se-text-paragraph",
    ],
  },
  editor: {
    key: "editor",
    priority: 2,
    selectors: [
      ".se-component.se-text .se-text-paragraph",
    ],
  },
  editorRead: {
    key: "editorRead",
    priority: 3,
    selectors: [
      ".se-component.se-text .se-text-paragraph",
    ],
  },
  publishButton: {
    key: "publishButton",
    priority: 4,
    selectors: [
      "button.publish_btn__m9KHH",
      "button[data-click-area='tpb.publish']",
      ".se-publish-button",
      "button:has-text('발행')",
    ],
  },
  confirmPublishButton: {
    key: "confirmPublishButton",
    priority: 5,
    selectors: [
      "button.confirm_btn__WEaBq",
      "button[data-testid='seOnePublishConfirmButton']",
      ".se-popup-button-confirm",
      "button:has-text('발행')",
    ],
  },
  tempSaveButton: {
    key: "tempSaveButton",
    priority: 6,
    selectors: [
      "button:has-text('임시저장')",
      "button.save_btn__bzc5B",
      "button[data-click-area*='tpb.temp']",
      ".se-toolbar-button-save",
      "button:has-text('저장')",
    ],
  },
  tagInput: {
    key: "tagInput",
    priority: 7,
    selectors: [
      "#tag-input",
      ".tag_input",
      "input[placeholder*='태그']",
      "input[placeholder*='tag' i]",
    ],
  },
  tagChip: {
    key: "tagChip",
    priority: 8,
    selectors: [".tag_item", ".se-tag-item", ".tag_list .item"],
  },
  popupDismiss: {
    key: "popupDismiss",
    priority: 9,
    selectors: [
      "button.se-popup-button-cancel",
      "button:has-text('취소')",
      "button:has-text('닫기')",
      ".btn_cancel",
      ".se-help-panel-close-button",
    ],
  },
  editorRoot: {
    key: "editorRoot",
    priority: 10,
    selectors: [
      "#mainFrame",
      ".se-main-container",
      ".se-title-text",
      ".se-documentTitle",
      ".se-text-paragraph",
      "iframe[name='mainFrame']",
    ],
  },
};

export function getSelectorList(key: NaverSelectorKey): readonly string[] {
  return NAVER_SELECTOR_REGISTRY[key].selectors;
}
