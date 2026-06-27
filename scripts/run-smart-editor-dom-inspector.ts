import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename: string): void {
  const filePath = resolve(process.cwd(), filename);

  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

process.env.NAVER_BROWSER_MODE = "playwright";
process.env.NAVER_EDITOR_HEADLESS ??= "false";

const hasNaverCredentials =
  Boolean(process.env.NAVER_USERNAME?.trim()) &&
  Boolean(process.env.NAVER_PASSWORD?.trim()) &&
  Boolean(process.env.NAVER_SESSION_SECRET?.trim());

async function main() {
  if (!hasNaverCredentials) {
    console.log("NAVER credentials required in .env.local");
    process.exit(1);
  }

  const { naverAutomationEngine } = await import(
    "../src/modules/publishing/naver/automation"
  );
  const { saveSmartEditorDomArtifacts } = await import(
    "../src/modules/publishing/naver/inspector/smart-editor-dom-inspector"
  );
  const { browserManager } = await import(
    "../src/modules/publishing/naver/browser/browser.manager"
  );

  try {
    const login = await naverAutomationEngine.ensureLoggedIn();

    if (!login.success) {
      console.log(login.message);
      process.exit(1);
    }

    const session = login.sessionId
      ? naverAutomationEngine.session.get(login.sessionId)
      : null;

    const opened = await naverAutomationEngine.editor.openEditor(session?.pageId ?? undefined);

    if (!opened.success || !opened.pageId) {
      console.log(opened.message);
      process.exit(1);
    }

    const ready = await naverAutomationEngine.editor.waitEditorReady(opened.pageId, 60_000);

    if (!ready.ready) {
      console.log(ready.message);
      process.exit(1);
    }

    const page = browserManager.resolvePage(opened.pageId);

    if (!page) {
      console.log("Editor page not found");
      process.exit(1);
    }

    const files = await saveSmartEditorDomArtifacts(page);

    for (const file of files) {
      console.log(file);
    }

    process.exit(0);
  } finally {
    await naverAutomationEngine.shutdown().catch(() => undefined);
  }
}

main();
