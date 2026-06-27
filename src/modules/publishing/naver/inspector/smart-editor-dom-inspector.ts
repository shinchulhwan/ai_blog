import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Frame, Page } from "playwright";
import { NAVER_EDITOR_DEBUG_DIR } from "../editor/naver-editor.config";

const DEBUG_DIR = path.join(process.cwd(), NAVER_EDITOR_DEBUG_DIR);

interface ElementSnapshot {
  tag: string;
  id: string | null;
  className: string | null;
  contentEditable: string | null;
  role: string | null;
  type: string | null;
  name: string | null;
  placeholder: string | null;
  dataPlaceholder: string | null;
  textPreview: string;
  outerHTMLPreview: string;
}

interface DomExtractionResult {
  source: "mainFrame" | "page";
  frameUrl: string;
  pageUrl: string;
  bodyInnerHTML: string;
  contenteditable: ElementSnapshot[];
  textarea: ElementSnapshot[];
  input: ElementSnapshot[];
  prosemirror: ElementSnapshot[];
  classes: string[];
  activeElement: ElementSnapshot | null;
}

function resolveEditorFrame(page: Page): Frame | null {
  return page.frame({ name: "mainFrame" }) ?? null;
}

const EXTRACT_DOM_SCRIPT = `
(() => {
  const describeEl = (el) => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    className: typeof el.className === "string" ? el.className : null,
    contentEditable: el.getAttribute("contenteditable"),
    role: el.getAttribute("role"),
    type: el.getAttribute("type"),
    name: el.getAttribute("name"),
    placeholder: el.getAttribute("placeholder"),
    dataPlaceholder: el.getAttribute("data-placeholder"),
    textPreview: (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 120),
    outerHTMLPreview: el.outerHTML.slice(0, 800),
  });

  const classSet = new Set();
  for (const el of document.querySelectorAll("*")) {
    if (typeof el.className === "string" && el.className.trim()) {
      for (const cls of el.className.split(/\\s+/)) {
        if (cls) classSet.add(cls);
      }
    }
  }

  const active = document.activeElement;

  return {
    bodyInnerHTML: document.body ? document.body.innerHTML : "",
    contenteditable: [...document.querySelectorAll("[contenteditable]")].map(describeEl),
    textarea: [...document.querySelectorAll("textarea")].map(describeEl),
    input: [...document.querySelectorAll("input")].map(describeEl),
    prosemirror: [...document.querySelectorAll(".ProseMirror, [class*='ProseMirror'], .pm-editor")].map(describeEl),
    classes: [...classSet].sort(),
    activeElement: active ? describeEl(active) : null,
  };
})()
`;

async function extractFromContext(
  page: Page,
  frame: Frame | null,
): Promise<DomExtractionResult> {
  const source = frame ? "mainFrame" : "page";
  const target = frame ?? page;

  const data = await target.evaluate(EXTRACT_DOM_SCRIPT);

  return {
    source,
    frameUrl: frame?.url() ?? page.url(),
    pageUrl: page.url(),
    ...data,
  };
}

export async function saveSmartEditorDomArtifacts(page: Page): Promise<string[]> {
  await mkdir(DEBUG_DIR, { recursive: true });

  const frame = resolveEditorFrame(page);
  const extracted = await extractFromContext(page, frame);
  const written: string[] = [];

  const writeJson = async (filename: string, payload: unknown) => {
    const filePath = path.join(DEBUG_DIR, filename);
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    written.push(filePath);
  };

  await writeFile(
    path.join(DEBUG_DIR, "editor-dom.html"),
    extracted.bodyInnerHTML,
    "utf8",
  );
  written.push(path.join(DEBUG_DIR, "editor-dom.html"));

  await writeJson("contenteditable.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    count: extracted.contenteditable.length,
    elements: extracted.contenteditable,
  });

  await writeJson("textarea.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    count: extracted.textarea.length,
    elements: extracted.textarea,
  });

  await writeJson("input.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    count: extracted.input.length,
    elements: extracted.input,
  });

  await writeJson("prosemirror.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    count: extracted.prosemirror.length,
    elements: extracted.prosemirror,
  });

  await writeJson("classes.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    count: extracted.classes.length,
    classes: extracted.classes,
  });

  await writeJson("active.json", {
    source: extracted.source,
    frameUrl: extracted.frameUrl,
    pageUrl: extracted.pageUrl,
    activeElement: extracted.activeElement,
  });

  const screenshotPath = path.join(DEBUG_DIR, "editor-dom.png");

  if (frame) {
    const frameElement = page.locator("#mainFrame").first();
    const attached = await frameElement.count().catch(() => 0);

    if (attached > 0) {
      await frameElement.screenshot({ path: screenshotPath, timeout: 15_000 }).catch(async () => {
        await page.screenshot({ path: screenshotPath, fullPage: true });
      });
    } else {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  } else {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  }

  written.push(screenshotPath);

  return written;
}
