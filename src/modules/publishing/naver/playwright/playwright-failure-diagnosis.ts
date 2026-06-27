export interface FailureDiagnosis {
  cause: string;
  suggestions: string[];
}

export function diagnosePlaywrightFailure(
  step: string,
  error: unknown,
  context?: { url?: string; mock?: boolean },
): FailureDiagnosis {
  const message = error instanceof Error ? error.message : String(error);
  const url = context?.url ?? "";
  const suggestions: string[] = [];

  if (context?.mock) {
    return {
      cause: `[${step}] Mock 모드에서 Playwright 동작이 호출되었습니다.`,
      suggestions: ["NAVER_BROWSER_MODE=playwright 로 실행하세요."],
    };
  }

  if (/제목 입력|title/i.test(message)) {
    suggestions.push(
      "naver-selector.registry.ts 의 title 셀렉터 우선순위를 확인하세요.",
      "npm run test:naver-inspector 로 live DOM을 수집하세요.",
      "에디터 iframe(mainFrame) 로딩 완료 후 재시도하세요.",
    );
  }

  if (/본문|content|editor/i.test(message)) {
    suggestions.push(
      "editor 셀렉터(.se-text-paragraph 등)가 변경되었을 수 있습니다.",
      "debug/page.html 과 debug/selectors.json 을 확인하세요.",
    );
  }

  if (/발행|publish/i.test(message)) {
    suggestions.push(
      "publishButton / confirmPublishButton 셀렉터를 registry에서 갱신하세요.",
      "발행 패널이 열린 뒤 confirm 버튼을 찾는지 debug/page.png 로 확인하세요.",
    );
  }

  if (/임시저장|tempSave|저장/i.test(message)) {
    suggestions.push(
      "tempSaveButton 셀렉터(button.save_btn__*) 해시 클래스 변경 여부를 확인하세요.",
    );
  }

  if (/pageId|페이지를 찾을 수 없/i.test(message)) {
    suggestions.push(
      "BrowserContext의 활성 Page와 pageId 캐시가 불일치했을 수 있습니다.",
      "로그인 후 openEditor() 를 다시 실행하세요.",
    );
  }

  if (/nidlogin|로그인|session|세션/i.test(message) || url.includes("nidlogin")) {
    suggestions.push(
      ".env.local 의 NAVER_USERNAME/PASSWORD/SESSION_SECRET 을 확인하세요.",
      "npm run test:naver-login 으로 세션을 재생성하세요.",
    );
  }

  if (/timeout/i.test(message)) {
    suggestions.push(
      "네트워크 지연 또는 headless 차단 가능성 — NAVER_EDITOR_HEADLESS=false 로 재시도하세요.",
      "debug/network.json 에서 실패 요청을 확인하세요.",
    );
  }

  if (/유효하지 않은 요청|blogId|블로그 아이디/i.test(message)) {
    suggestions.push(
      "NAVER_USERNAME 이 실제 블로그 ID와 일치하는지 확인하세요.",
      "buildNaverEditorWriteUrlCandidates() URL 후보를 확인하세요.",
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "debug/ 아티팩트(trace.zip, page.html, page.png, network.json)를 확인하세요.",
      "npm run test:naver-inspector 로 셀렉터를 재수집하세요.",
    );
  }

  return {
    cause: `[${step}] ${message}`,
    suggestions,
  };
}

export function formatFailureDiagnosis(diagnosis: FailureDiagnosis): string {
  return [
    `원인: ${diagnosis.cause}`,
    "수정 제안:",
    ...diagnosis.suggestions.map((item) => `- ${item}`),
  ].join("\n");
}
