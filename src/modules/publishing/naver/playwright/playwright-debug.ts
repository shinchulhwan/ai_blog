import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Page } from "playwright";
import { NAVER_EDITOR_DEBUG_DIR } from "../editor/naver-editor.config";
import {
  diagnosePlaywrightFailure,
  formatFailureDiagnosis,
  type FailureDiagnosis,
} from "./playwright-failure-diagnosis";

const DEBUG_DIR = path.join(process.cwd(), NAVER_EDITOR_DEBUG_DIR);

interface NetworkEntry {
  url: string;
  method: string;
  status: number | null;
  resourceType: string;
  failed: boolean;
}

export class PlaywrightDebugSession {
  private traceStarted = false;
  private readonly consoleLogs = new Map<Page, string[]>();
  private readonly networkLogs = new Map<Page, NetworkEntry[]>();

  attach(page: Page): void {
    if (!this.consoleLogs.has(page)) {
      const logs: string[] = [];
      this.consoleLogs.set(page, logs);
      page.on("console", (message) => {
        logs.push(`[${message.type()}] ${message.text()}`);
      });
    }

    if (!this.networkLogs.has(page)) {
      const entries: NetworkEntry[] = [];
      this.networkLogs.set(page, entries);

      page.on("response", (response) => {
        entries.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          resourceType: response.request().resourceType(),
          failed: !response.ok(),
        });
      });

      page.on("requestfailed", (request) => {
        entries.push({
          url: request.url(),
          method: request.method(),
          status: null,
          resourceType: request.resourceType(),
          failed: true,
        });
      });
    }
  }

  async startTrace(page: Page): Promise<void> {
    if (this.traceStarted) {
      return;
    }

    this.attach(page);

    try {
      const context = page.context();
      await mkdir(DEBUG_DIR, { recursive: true });
      await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
      this.traceStarted = true;
    } catch {
      this.traceStarted = false;
    }
  }

  async saveArtifacts(
    page: Page,
    step: string,
    error?: unknown,
    options?: { finalizeTrace?: boolean },
  ): Promise<FailureDiagnosis | null> {
    await mkdir(DEBUG_DIR, { recursive: true });
    this.attach(page);

    let diagnosis: FailureDiagnosis | null = null;

    if (error) {
      diagnosis = diagnosePlaywrightFailure(step, error, { url: page.url() });
      await writeFile(
        path.join(DEBUG_DIR, "failure.txt"),
        formatFailureDiagnosis(diagnosis),
        "utf8",
      );
    }

    try {
      await page.screenshot({
        path: path.join(DEBUG_DIR, "page.png"),
        fullPage: true,
      });
    } catch {
      // ignore screenshot errors
    }

    try {
      const htmlParts = [`<!-- url=${page.url()} step=${step} -->\n${await page.content()}`];

      for (const frame of page.frames()) {
        if (frame === page.mainFrame()) {
          continue;
        }

        try {
          const frameHtml = await frame.evaluate(() => document.documentElement.outerHTML);
          htmlParts.push(
            `<!-- frame=${frame.name()} url=${frame.url()} -->\n${frameHtml}`,
          );
        } catch {
          htmlParts.push(`<!-- frame unavailable: ${frame.url()} -->`);
        }
      }

      await writeFile(path.join(DEBUG_DIR, "page.html"), htmlParts.join("\n\n"), "utf8");
    } catch {
      // ignore html errors
    }

    const logs = this.consoleLogs.get(page) ?? [];
    await writeFile(path.join(DEBUG_DIR, "console.log"), logs.join("\n"), "utf8");

    const network = this.networkLogs.get(page) ?? [];
    await writeFile(
      path.join(DEBUG_DIR, "network.json"),
      JSON.stringify(
        {
          step,
          url: page.url(),
          collectedAt: new Date().toISOString(),
          entries: network.slice(-500),
        },
        null,
        2,
      ),
      "utf8",
    );

    await writeFile(
      path.join(DEBUG_DIR, "current-url.txt"),
      [
        `step=${step}`,
        `url=${page.url()}`,
        `error=${error instanceof Error ? error.message : error ? String(error) : "none"}`,
      ].join("\n"),
      "utf8",
    );

    if (options?.finalizeTrace !== false) {
      await this.stopTrace();
    }

    return diagnosis;
  }

  async stopTrace(): Promise<void> {
    if (!this.traceStarted) {
      return;
    }

    try {
      await mkdir(DEBUG_DIR, { recursive: true });
      const contexts = new Set(
        Array.from(this.consoleLogs.keys()).map((page) => page.context()),
      );

      for (const context of contexts) {
        await context.tracing.stop({
          path: path.join(DEBUG_DIR, "trace.zip"),
        });
      }
    } catch {
      // ignore trace stop errors
    } finally {
      this.traceStarted = false;
    }
  }
}

export const playwrightDebugSession = new PlaywrightDebugSession();

export { formatFailureDiagnosis };
