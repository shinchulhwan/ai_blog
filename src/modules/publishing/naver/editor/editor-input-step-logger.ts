import type { Page } from "playwright";

export const EDITOR_INPUT_TIMEOUT_MS = 60_000;

export const EDITOR_INPUT_STEP_LABELS: Record<number, string> = {
  1: "Editor Open",
  2: "Wait Editor",
  3: "Find Title",
  4: "Click Title",
  5: "Keyboard.insertText",
  6: "Read Title",
  7: "Input Content",
  8: "Validate Content",
};

export function logEditorInputTrace(
  step: number,
  label: string,
  phase: "before" | "after",
  detail?: Record<string, string | number | boolean>,
): void {
  console.log(`[${step}] ${label} - ${phase}`);

  if (!detail) {
    return;
  }

  for (const [key, value] of Object.entries(detail)) {
    console.log(`${key}=${value}`);
  }
}

export function isEditorInputVerbose(): boolean {
  return process.env.NAVER_EDITOR_INPUT_VERBOSE === "1";
}

export class EditorInputStepTimeoutError extends Error {
  constructor(
    readonly step: number,
    readonly actionLabel: string,
  ) {
    const stepLabel = EDITOR_INPUT_STEP_LABELS[step] ?? `Step ${step}`;
    super(`[${step}] ${stepLabel} timeout after ${EDITOR_INPUT_TIMEOUT_MS}ms (${actionLabel})`);
    this.name = "EditorInputStepTimeoutError";
  }
}

export async function dumpEditorInputStuckState(
  page: Page,
  selector?: string,
): Promise<void> {
  console.log(`  current-url: ${page.url()}`);

  const mainFrame = page.frame({ name: "mainFrame" });
  console.log(`  current-iframe: ${mainFrame?.url() ?? "none"}`);
  console.log(`  current-selector: ${selector ?? "n/a"}`);

  const pageActive = await page
    .evaluate(() => {
      const el = document.activeElement;
      if (!el) {
        return "none";
      }

      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const className =
        typeof el.className === "string"
          ? el.className
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 3)
              .join(".")
          : "";
      const cls = className ? `.${className}` : "";

      return `${tag}${id}${cls}`;
    })
    .catch(() => "unknown");

  let iframeActive = "none";

  if (mainFrame) {
    iframeActive = await mainFrame
      .evaluate(() => {
        const el = document.activeElement;
        if (!el) {
          return "none";
        }

        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const className =
          typeof el.className === "string"
            ? el.className
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 3)
                .join(".")
            : "";
        const cls = className ? `.${className}` : "";

        return `${tag}${id}${cls}`;
      })
      .catch(() => "unknown");
  }

  console.log(`  current-activeElement: page=${pageActive}, iframe=${iframeActive}`);
}

export async function runEditorInputStep<T>(
  step: number,
  actionLabel: string,
  action: () => Promise<T>,
  debugContext?: () => Promise<{ page?: Page; selector?: string }>,
): Promise<T> {
  const stepLabel = EDITOR_INPUT_STEP_LABELS[step] ?? `Step ${step}`;
  console.log(`[${step}] ${stepLabel} — before: ${actionLabel}`);

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      void (async () => {
        console.log(
          `[${step}] ${stepLabel} — TIMEOUT (${EDITOR_INPUT_TIMEOUT_MS}ms): ${actionLabel}`,
        );

        if (debugContext) {
          try {
            const ctx = await debugContext();
            if (ctx.page) {
              await dumpEditorInputStuckState(ctx.page, ctx.selector);
            }
          } catch {
            // ignore debug dump errors on timeout
          }
        }

        reject(new EditorInputStepTimeoutError(step, actionLabel));
      })();
    }, EDITOR_INPUT_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([action(), timeoutPromise]);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    console.log(`[${step}] ${stepLabel} — after: ${actionLabel}`);
    return result;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (error instanceof EditorInputStepTimeoutError) {
      throw error;
    }

    console.log(
      `[${step}] ${stepLabel} — error: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}
