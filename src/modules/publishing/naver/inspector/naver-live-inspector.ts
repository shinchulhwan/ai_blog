import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { Frame, Page } from "playwright";
import { NAVER_EDITOR_DEBUG_DIR } from "../editor/naver-editor.config";
import { playwrightDebugSession } from "../playwright/playwright-debug";
import type {
  DataAttributeSample,
  EditorSelectorAnalysis,
  InspectedElement,
  InspectedFrame,
  NaverLiveInspectionResult,
  PrioritizedSelector,
} from "./naver-live-inspector.types";

const DEBUG_DIR = path.join(process.cwd(), NAVER_EDITOR_DEBUG_DIR);

const COLLECT_DOCUMENT_SECTIONS_SOURCE = String.raw`(() => {
  function escapeCss(value) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/([^\w-])/g, "\\$1");
  }

  function buildSelector(element) {
    if (element.id) {
      return "#" + escapeCss(element.id);
    }
    var tag = element.tagName.toLowerCase();
    var classes = Array.from(element.classList).filter(Boolean).slice(0, 3);
    if (classes.length > 0) {
      return tag + "." + classes.map(escapeCss).join(".");
    }
    var parent = element.parentElement;
    if (!parent) {
      return tag;
    }
    var siblings = Array.from(parent.children).filter(function(child) {
      return child.tagName === element.tagName;
    });
    var index = siblings.indexOf(element) + 1;
    return buildSelector(parent) + " > " + tag + ":nth-of-type(" + index + ")";
  }

  function shortText(element) {
    var text = (element.textContent || "").trim().replace(/\s+/g, " ");
    if (!text) {
      return null;
    }
    return text.slice(0, 120);
  }

  function collectDataAttributes(element) {
    var attrs = {};
    Array.from(element.attributes).forEach(function(attr) {
      if (attr.name.indexOf("data-") === 0) {
        attrs[attr.name] = attr.value.slice(0, 200);
      }
    });
    return Object.keys(attrs).length > 0 ? attrs : undefined;
  }

  function mapElement(element) {
    return {
      tag: element.tagName.toLowerCase(),
      selector: buildSelector(element),
      id: element.id || null,
      className: element.className ? String(element.className).slice(0, 240) : null,
      text: shortText(element),
      ariaLabel: element.getAttribute("aria-label"),
      role: element.getAttribute("role"),
      type: element.getAttribute("type"),
      placeholder: element.getAttribute("placeholder"),
      name: element.getAttribute("name"),
      contenteditable: element.getAttribute("contenteditable") === "true",
      dataAttributes: collectDataAttributes(element),
    };
  }

  function collectDataAttributeSamples(doc) {
    var samples = [];
    var seen = new Set();
    doc.querySelectorAll("*").forEach(function(element) {
      Array.from(element.attributes).forEach(function(attr) {
        if (attr.name.indexOf("data-") !== 0) {
          return;
        }
        var key = attr.name + "=" + attr.value.slice(0, 80);
        if (seen.has(key)) {
          return;
        }
        seen.add(key);
        samples.push({
          attribute: attr.name,
          selector: buildSelector(element),
          value: attr.value.slice(0, 200),
        });
      });
    });
    return samples.slice(0, 300);
  }

  function inspectDocument(doc) {
    var contenteditable = Array.from(doc.querySelectorAll('[contenteditable="true"]')).map(mapElement);
    var textareas = Array.from(doc.querySelectorAll("textarea")).map(mapElement);
    var inputs = Array.from(doc.querySelectorAll("input")).map(mapElement);
    var proseMirror = Array.from(
      doc.querySelectorAll('.ProseMirror, [class*="ProseMirror"], [class*="prosemirror"]'),
    ).map(mapElement);
    var buttons = Array.from(
      doc.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]'),
    ).map(mapElement);
    var ariaLabels = Array.from(doc.querySelectorAll("[aria-label]")).map(mapElement);
    var roles = Array.from(doc.querySelectorAll("[role]")).map(mapElement);
    var dataAttributes = collectDataAttributeSamples(doc);
    var candidateSet = new Set();
    doc.querySelectorAll(
      "[id], [class], button, input, textarea, select, [contenteditable], [role], a, iframe",
    ).forEach(function(element) {
      candidateSet.add(buildSelector(element));
    });
    return {
      title: doc.title,
      contenteditable: contenteditable,
      textareas: textareas,
      inputs: inputs,
      proseMirror: proseMirror,
      buttons: buttons,
      ariaLabels: ariaLabels,
      roles: roles,
      dataAttributes: dataAttributes,
      selectorCandidates: Array.from(candidateSet).slice(0, 200),
    };
  }

  var sections = [{
    label: "PAGE",
    url: document.location.href,
    html: document.documentElement.outerHTML,
    snapshot: inspectDocument(document),
  }];

  document.querySelectorAll("iframe").forEach(function(iframe) {
    try {
      var doc = iframe.contentDocument;
      if (!doc) {
        return;
      }
      sections.push({
        label: "IFRAME name=" + (iframe.getAttribute("name") || "") + " id=" + (iframe.id || ""),
        url: iframe.getAttribute("src") || doc.location.href,
        html: doc.documentElement.outerHTML,
        snapshot: inspectDocument(doc),
      });
    } catch (e) {}
  });

  return sections;
})()`;

type FrameSnapshot = {
  title: string;
  contenteditable: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  textareas: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  inputs: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  proseMirror: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  buttons: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  ariaLabels: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  roles: Omit<InspectedElement, "frameIndex" | "frameUrl">[];
  dataAttributes: Omit<DataAttributeSample, "frameIndex" | "frameUrl">[];
  selectorCandidates: string[];
};

type DocumentSection = {
  label: string;
  url: string;
  html: string;
  snapshot: FrameSnapshot;
};

function frameIndexOf(frames: Frame[], frame: Frame): number {
  return frames.findIndex((item) => item === frame);
}

function parentFrameIndex(frames: Frame[], frame: Frame): number | null {
  const parent = frame.parentFrame();

  if (!parent) {
    return null;
  }

  const index = frameIndexOf(frames, parent);
  return index >= 0 ? index : null;
}

function withFrameMeta<T extends object>(
  frameIndex: number,
  frameUrl: string,
  items: T[],
): Array<T & { frameIndex: number; frameUrl: string }> {
  return items.map((item) => ({
    frameIndex,
    frameUrl,
    ...item,
  }));
}

function appendSnapshot(
  target: {
    contenteditable: InspectedElement[];
    textareas: InspectedElement[];
    inputs: InspectedElement[];
    proseMirror: InspectedElement[];
    buttons: InspectedElement[];
    ariaLabels: InspectedElement[];
    roles: InspectedElement[];
    dataAttributes: DataAttributeSample[];
    selectorCandidates: NaverLiveInspectionResult["selectorCandidates"];
  },
  frameIndex: number,
  frameUrl: string,
  snapshot: FrameSnapshot,
): void {
  target.contenteditable.push(...withFrameMeta(frameIndex, frameUrl, snapshot.contenteditable));
  target.textareas.push(...withFrameMeta(frameIndex, frameUrl, snapshot.textareas));
  target.inputs.push(...withFrameMeta(frameIndex, frameUrl, snapshot.inputs));
  target.proseMirror.push(...withFrameMeta(frameIndex, frameUrl, snapshot.proseMirror));
  target.buttons.push(...withFrameMeta(frameIndex, frameUrl, snapshot.buttons));
  target.ariaLabels.push(...withFrameMeta(frameIndex, frameUrl, snapshot.ariaLabels));
  target.roles.push(...withFrameMeta(frameIndex, frameUrl, snapshot.roles));
  target.dataAttributes.push(
    ...withFrameMeta(frameIndex, frameUrl, snapshot.dataAttributes),
  );

  for (const selector of snapshot.selectorCandidates) {
    if (target.selectorCandidates.length >= 200) {
      break;
    }

    target.selectorCandidates.push({
      frameIndex,
      frameUrl,
      selector,
    });
  }
}

function pushUnique(
  list: PrioritizedSelector[],
  seen: Set<string>,
  candidate: PrioritizedSelector,
): void {
  const key = `${candidate.frameIndex}:${candidate.selector}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  list.push(candidate);
}

function analyzeEditorSelectors(result: {
  contenteditable: InspectedElement[];
  buttons: InspectedElement[];
  ariaLabels: InspectedElement[];
  roles: InspectedElement[];
  dataAttributes: DataAttributeSample[];
  selectorCandidates: NaverLiveInspectionResult["selectorCandidates"];
}): EditorSelectorAnalysis {
  const title: PrioritizedSelector[] = [];
  const content: PrioritizedSelector[] = [];
  const publish: PrioritizedSelector[] = [];
  const tempSave: PrioritizedSelector[] = [];
  const seen = {
    title: new Set<string>(),
    content: new Set<string>(),
    publish: new Set<string>(),
    tempSave: new Set<string>(),
  };

  const titlePatterns: Array<{ pattern: RegExp; priority: number; reason: string }> = [
    { pattern: /\.se-documentTitle.*\.se-title-text/, priority: 1, reason: "SmartEditor ONE 제목 모듈" },
    { pattern: /\.se-section-documentTitle/, priority: 2, reason: "제목 섹션" },
    { pattern: /\.se-title-text/, priority: 3, reason: "제목 텍스트 영역" },
    { pattern: /documentTitle/, priority: 4, reason: "documentTitle 클래스" },
    { pattern: /제목/, priority: 5, reason: "제목 placeholder/aria" },
  ];

  const contentPatterns: Array<{ pattern: RegExp; priority: number; reason: string }> = [
    {
      pattern: /\.se-component:not\(\.se-documentTitle\).*\.se-text-paragraph/,
      priority: 1,
      reason: "제목 제외 본문 단락",
    },
    { pattern: /\.se-main-container/, priority: 2, reason: "본문 메인 컨테이너" },
    { pattern: /\.se-section-text/, priority: 3, reason: "본문 텍스트 섹션" },
    { pattern: /\.se-text-paragraph/, priority: 4, reason: "본문 단락 (제목과 구분 필요)" },
    { pattern: /\.se-module-text/, priority: 5, reason: "텍스트 모듈" },
    { pattern: /\.se-component-content/, priority: 6, reason: "컴포넌트 콘텐츠" },
    { pattern: /ProseMirror/, priority: 7, reason: "ProseMirror 에디터" },
  ];

  for (const candidate of result.selectorCandidates) {
    for (const rule of titlePatterns) {
      if (rule.pattern.test(candidate.selector)) {
        pushUnique(title, seen.title, {
          priority: rule.priority,
          selector: candidate.selector,
          frameIndex: candidate.frameIndex,
          frameUrl: candidate.frameUrl,
          reason: rule.reason,
        });
      }
    }

    for (const rule of contentPatterns) {
      if (rule.pattern.test(candidate.selector)) {
        pushUnique(content, seen.content, {
          priority: rule.priority,
          selector: candidate.selector,
          frameIndex: candidate.frameIndex,
          frameUrl: candidate.frameUrl,
          reason: rule.reason,
        });
      }
    }
  }

  for (const element of result.contenteditable) {
    const className = element.className ?? "";
    const selector = element.selector;

    if (/documentTitle|se-title|title-text/i.test(`${className} ${selector}`)) {
      pushUnique(title, seen.title, {
        priority: 1,
        selector,
        frameIndex: element.frameIndex,
        frameUrl: element.frameUrl,
        reason: "contenteditable 제목 영역",
      });
    } else if (!/documentTitle|se-title/i.test(`${className} ${selector}`)) {
      pushUnique(content, seen.content, {
        priority: 2,
        selector,
        frameIndex: element.frameIndex,
        frameUrl: element.frameUrl,
        reason: "contenteditable 본문 영역",
      });
    }
  }

  for (const element of result.buttons) {
    const text = element.text ?? "";
    const className = element.className ?? "";
    const selector = element.selector;
    const aria = element.ariaLabel ?? "";

    if (/publish_btn|발행|publish/i.test(`${className} ${text} ${selector}`)) {
      pushUnique(publish, seen.publish, {
        priority: /publish_btn/.test(className) ? 1 : 2,
        selector,
        frameIndex: element.frameIndex,
        frameUrl: element.frameUrl,
        reason: text ? `발행 버튼 (text="${text}")` : "발행 버튼 클래스",
      });
    }

    if (
      /save_btn|임시저장|저장/.test(`${className} ${text} ${aria}`) &&
      !/발행|publish/i.test(text)
    ) {
      pushUnique(tempSave, seen.tempSave, {
        priority: /save_btn/.test(className) ? 1 : aria.includes("임시저장") ? 2 : 3,
        selector,
        frameIndex: element.frameIndex,
        frameUrl: element.frameUrl,
        reason: aria || text || "저장/임시저장 버튼",
      });
    }
  }

  for (const sample of result.dataAttributes) {
    if (sample.attribute === "data-click-area" && /publish/i.test(sample.value)) {
      pushUnique(publish, seen.publish, {
        priority: 1,
        selector: `${sample.selector}[data-click-area="${sample.value}"]`,
        frameIndex: sample.frameIndex,
        frameUrl: sample.frameUrl,
        reason: `data-click-area=${sample.value}`,
      });
    }

    if (sample.attribute === "data-a11y-title" && sample.value === "제목") {
      pushUnique(title, seen.title, {
        priority: 1,
        selector: `${sample.selector}[data-a11y-title="제목"]`,
        frameIndex: sample.frameIndex,
        frameUrl: sample.frameUrl,
        reason: "data-a11y-title=제목",
      });
    }
  }

  const sortByPriority = (items: PrioritizedSelector[]) =>
    items.sort((left, right) => left.priority - right.priority);

  return {
    title: sortByPriority(title),
    content: sortByPriority(content),
    publish: sortByPriority(publish),
    tempSave: sortByPriority(tempSave),
  };
}

async function inspectFrame(frame: Frame): Promise<{
  snapshot: FrameSnapshot | null;
  html: string | null;
}> {
  try {
    await frame.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => null);
    await frame.waitForSelector("body", { timeout: 20_000 }).catch(() => null);

    const snapshot = await frame.evaluate(() => {
      function escapeCss(value: string): string {
        if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
          return CSS.escape(value);
        }

        return value.replace(/([^\w-])/g, "\\$1");
      }

      function buildSelector(element: Element): string {
        if (element.id) {
          return `#${escapeCss(element.id)}`;
        }

        const tag = element.tagName.toLowerCase();
        const classes = Array.from(element.classList)
          .filter(Boolean)
          .slice(0, 3);

        if (classes.length > 0) {
          return `${tag}.${classes.map(escapeCss).join(".")}`;
        }

        return tag;
      }

      function collectDataAttributes(element: Element): Record<string, string> | undefined {
        const attrs: Record<string, string> = {};

        for (const attr of Array.from(element.attributes)) {
          if (attr.name.startsWith("data-")) {
            attrs[attr.name] = attr.value.slice(0, 200);
          }
        }

        return Object.keys(attrs).length > 0 ? attrs : undefined;
      }

      function mapElement(element: Element) {
        return {
          tag: element.tagName.toLowerCase(),
          selector: buildSelector(element),
          id: element.id || null,
          className: element.className ? String(element.className).slice(0, 240) : null,
          text: (element.textContent ?? "").trim().slice(0, 120) || null,
          ariaLabel: element.getAttribute("aria-label"),
          role: element.getAttribute("role"),
          type: element.getAttribute("type"),
          placeholder: element.getAttribute("placeholder"),
          name: element.getAttribute("name"),
          contenteditable: element.getAttribute("contenteditable") === "true",
          dataAttributes: collectDataAttributes(element),
        };
      }

      function collectDataAttributeSamples(doc: Document) {
        const samples: Array<{ attribute: string; selector: string; value: string }> = [];
        const seen = new Set<string>();

        doc.querySelectorAll("*").forEach((element) => {
          for (const attr of Array.from(element.attributes)) {
            if (!attr.name.startsWith("data-")) {
              continue;
            }

            const key = `${attr.name}=${attr.value.slice(0, 80)}`;

            if (seen.has(key)) {
              continue;
            }

            seen.add(key);
            samples.push({
              attribute: attr.name,
              selector: buildSelector(element),
              value: attr.value.slice(0, 200),
            });
          }
        });

        return samples.slice(0, 300);
      }

      const candidateSet = new Set<string>();

      document
        .querySelectorAll(
          "[id], [class], button, input, textarea, select, [contenteditable], [role], a, iframe",
        )
        .forEach((element) => {
          candidateSet.add(buildSelector(element));
        });

      return {
        title: document.title,
        contenteditable: Array.from(document.querySelectorAll('[contenteditable="true"]')).map(
          mapElement,
        ),
        textareas: Array.from(document.querySelectorAll("textarea")).map(mapElement),
        inputs: Array.from(document.querySelectorAll("input")).map(mapElement),
        proseMirror: Array.from(
          document.querySelectorAll('.ProseMirror, [class*="ProseMirror"], [class*="prosemirror"]'),
        ).map(mapElement),
        buttons: Array.from(
          document.querySelectorAll(
            'button, [role="button"], input[type="button"], input[type="submit"]',
          ),
        ).map(mapElement),
        ariaLabels: Array.from(document.querySelectorAll("[aria-label]")).map(mapElement),
        roles: Array.from(document.querySelectorAll("[role]")).map(mapElement),
        dataAttributes: collectDataAttributeSamples(document),
        selectorCandidates: Array.from(candidateSet).slice(0, 200),
      };
    });

    const html = await frame.evaluate(() => document.documentElement.outerHTML);

    return { snapshot, html };
  } catch {
    return { snapshot: null, html: null };
  }
}

export async function inspectNaverLiveEditor(page: Page): Promise<NaverLiveInspectionResult> {
  await mkdir(DEBUG_DIR, { recursive: true });
  await playwrightDebugSession.startTrace(page);
  await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(2_000);

  const frames = page.frames();
  const frameInfos: InspectedFrame[] = frames.map((frame, index) => ({
    index,
    name: frame.name(),
    url: frame.url(),
    parentIndex: parentFrameIndex(frames, frame),
  }));

  const contenteditable: InspectedElement[] = [];
  const textareas: InspectedElement[] = [];
  const inputs: InspectedElement[] = [];
  const proseMirror: InspectedElement[] = [];
  const buttons: InspectedElement[] = [];
  const ariaLabels: InspectedElement[] = [];
  const roles: InspectedElement[] = [];
  const dataAttributes: DataAttributeSample[] = [];
  const selectorCandidates: NaverLiveInspectionResult["selectorCandidates"] = [];
  const domParts: string[] = [];
  const collectedFrameKeys = new Set<string>();

  const aggregateTarget = {
    contenteditable,
    textareas,
    inputs,
    proseMirror,
    buttons,
    ariaLabels,
    roles,
    dataAttributes,
    selectorCandidates,
  };

  let documentTitle = "";

  const sections = (await page.evaluate(COLLECT_DOCUMENT_SECTIONS_SOURCE)) as DocumentSection[];

  for (const [index, section] of sections.entries()) {
    const frameUrl = section.url;
    const frameKey = `${index}:${frameUrl}`;
    collectedFrameKeys.add(frameKey);

    domParts.push(`<!-- ${section.label} url=${frameUrl} -->\n${section.html}`);

    if (!documentTitle && section.snapshot.title) {
      documentTitle = section.snapshot.title;
    }

    appendSnapshot(aggregateTarget, index, frameUrl, section.snapshot);
  }

  for (const [index, frame] of frames.entries()) {
    const frameUrl = frame.url();
    const frameKey = `${index}:${frameUrl}`;

    if (collectedFrameKeys.has(frameKey)) {
      continue;
    }

    const { snapshot, html } = await inspectFrame(frame);

    domParts.push(
      `<!-- FRAME index=${index} name=${frame.name()} url=${frameUrl} -->\n${html ?? "<!-- frame unavailable -->"}`,
    );

    if (!snapshot) {
      continue;
    }

    if (frame === page.mainFrame() && snapshot.title) {
      documentTitle = snapshot.title;
    }

    appendSnapshot(aggregateTarget, index, frameUrl, snapshot);
  }

  const editorSelectors = analyzeEditorSelectors({
    contenteditable,
    buttons,
    ariaLabels,
    roles,
    dataAttributes,
    selectorCandidates,
  });

  const result: NaverLiveInspectionResult = {
    url: page.url(),
    title: documentTitle || (await page.title().catch(() => "")),
    collectedAt: new Date().toISOString(),
    pwdebug: process.env.PWDEBUG === "1",
    frames: frameInfos,
    contenteditable,
    textareas,
    inputs,
    proseMirror,
    buttons,
    ariaLabels,
    roles,
    dataAttributes,
    selectorCandidates: selectorCandidates.slice(0, 200),
    editorSelectors,
  };

  await writeFile(path.join(DEBUG_DIR, "dom.html"), domParts.join("\n\n"), "utf8");
  await writeFile(
    path.join(DEBUG_DIR, "selectors.json"),
    JSON.stringify(
      {
        url: result.url,
        title: result.title,
        selectorCandidates: result.selectorCandidates,
        editorSelectors: result.editorSelectors,
      },
      null,
      2,
    ),
    "utf8",
  );
  await writeFile(path.join(DEBUG_DIR, "buttons.json"), JSON.stringify(result.buttons, null, 2), "utf8");
  await writeFile(path.join(DEBUG_DIR, "frames.json"), JSON.stringify(result.frames, null, 2), "utf8");
  await writeFile(
    path.join(DEBUG_DIR, "editor.json"),
    JSON.stringify(
      {
        url: result.url,
        collectedAt: result.collectedAt,
        frames: result.frames,
        inputs: result.inputs,
        textareas: result.textareas,
        contenteditable: result.contenteditable,
        proseMirror: result.proseMirror,
        buttons: result.buttons,
        ariaLabels: result.ariaLabels,
        roles: result.roles,
        dataAttributes: result.dataAttributes,
        editorSelectors: result.editorSelectors,
      },
      null,
      2,
    ),
    "utf8",
  );

  await playwrightDebugSession.saveArtifacts(page, "inspector");

  return result;
}

export async function pauseForLiveInspection(page: Page): Promise<void> {
  if (process.env.PWDEBUG === "1") {
    await page.pause();
    return;
  }

  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdout.write("\n브라우저를 열린 상태로 유지합니다. 종료하려면 Enter를 누르세요.\n");
    process.stdin.once("data", () => {
      process.stdin.pause();
      resolve();
    });
  });
}
