import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { naverAutomationEngine } from "../src/modules/publishing/naver/automation";

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

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  process.env.NAVER_BROWSER_MODE ??= "playwright";

  const hasUsername = Boolean(process.env.NAVER_USERNAME?.trim());
  const hasPassword = Boolean(process.env.NAVER_PASSWORD?.trim());
  const hasSecret = Boolean(process.env.NAVER_SESSION_SECRET?.trim());

  if (!hasUsername || !hasPassword || !hasSecret) {
    console.log(
      JSON.stringify({
        status: "SKIPPED",
        reason: "NAVER_USERNAME, NAVER_PASSWORD, NAVER_SESSION_SECRET required in .env.local",
      }),
    );
    process.exit(0);
  }

  const startedAt = Date.now();

  try {
    const first = await naverAutomationEngine.ensureLoggedIn();
    const second = await naverAutomationEngine.ensureLoggedIn();

    console.log(
      JSON.stringify(
        {
          status: first.success && second.success ? "SUCCESS" : "FAILED",
          durationMs: Date.now() - startedAt,
          firstLogin: {
            success: first.success,
            message: first.message,
            sessionId: first.sessionId,
            mock: first.mock,
          },
          sessionReuse: {
            success: second.success,
            message: second.message,
            reused: second.message === "기존 세션 사용",
          },
          sessionFile: "data/naver-auth/env-default/session.enc",
          cookiesFile: "data/naver-auth/env-default/cookies.enc",
        },
        null,
        2,
      ),
    );

    process.exit(first.success && second.success ? 0 : 1);
  } catch (error) {
    console.log(
      JSON.stringify({
        status: "FAILED",
        durationMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exit(1);
  } finally {
    await naverAutomationEngine.shutdown().catch(() => undefined);
  }
}

main();
