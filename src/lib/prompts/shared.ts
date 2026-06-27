export const JSON_ONLY_SUFFIX =
  "반드시 JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.";

export function withJsonOnly(instructions: string): string {
  return `${instructions}\n\n${JSON_ONLY_SUFFIX}`;
}
