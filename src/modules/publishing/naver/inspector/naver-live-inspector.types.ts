export interface InspectedElement {
  frameIndex: number;
  frameUrl: string;
  tag: string;
  selector: string;
  id: string | null;
  className: string | null;
  text: string | null;
  ariaLabel: string | null;
  role: string | null;
  type: string | null;
  placeholder: string | null;
  name: string | null;
  contenteditable: boolean;
  dataAttributes?: Record<string, string>;
}

export interface InspectedFrame {
  index: number;
  name: string;
  url: string;
  parentIndex: number | null;
}

export interface DataAttributeSample {
  frameIndex: number;
  frameUrl: string;
  attribute: string;
  selector: string;
  value: string;
}

export interface PrioritizedSelector {
  priority: number;
  selector: string;
  frameIndex: number;
  frameUrl: string;
  reason: string;
}

export interface EditorSelectorAnalysis {
  title: PrioritizedSelector[];
  content: PrioritizedSelector[];
  publish: PrioritizedSelector[];
  tempSave: PrioritizedSelector[];
}

export interface NaverLiveInspectionResult {
  url: string;
  title: string;
  collectedAt: string;
  pwdebug: boolean;
  frames: InspectedFrame[];
  contenteditable: InspectedElement[];
  textareas: InspectedElement[];
  inputs: InspectedElement[];
  proseMirror: InspectedElement[];
  buttons: InspectedElement[];
  ariaLabels: InspectedElement[];
  roles: InspectedElement[];
  dataAttributes: DataAttributeSample[];
  selectorCandidates: Array<{
    frameIndex: number;
    frameUrl: string;
    selector: string;
  }>;
  editorSelectors: EditorSelectorAnalysis;
}
