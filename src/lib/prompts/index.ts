import { localBusinessPrompts } from "./localBusiness";
import { newsPrompts } from "./news";
import { reviewPrompts } from "./review";
import { seoBlogPrompts } from "./seoBlog";
import { shoppingPrompts } from "./shopping";
import type { PromptPackId } from "./types";

export { withJsonOnly, JSON_ONLY_SUFFIX } from "./shared";
export type { PromptPackId, EvaluationInput, RevisionInput } from "./types";

export { seoBlogPrompts } from "./seoBlog";
export { reviewPrompts } from "./review";
export { newsPrompts } from "./news";
export { shoppingPrompts } from "./shopping";
export { localBusinessPrompts } from "./localBusiness";

/** Central registry — add new prompt packs here */
export const promptRegistry = {
  seoBlog: seoBlogPrompts,
  review: reviewPrompts,
  news: newsPrompts,
  shopping: shoppingPrompts,
  localBusiness: localBusinessPrompts,
} as const;

export const defaultPromptPackId: PromptPackId = "seoBlog";

export function getPromptPack<T extends PromptPackId>(id: T) {
  return promptRegistry[id];
}

export function listPromptPacks() {
  return Object.values(promptRegistry).map((pack) => pack.meta);
}
