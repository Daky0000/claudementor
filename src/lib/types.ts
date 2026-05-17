export interface DesignSession {
  id: string;
  prompt: string;
  html: string;
  title: string;
  createdAt: number;
}

export interface ElementorWidget {
  id: string;
  elType: "widget";
  widgetType: string;
  settings: Record<string, unknown>;
  elements: [];
}

export interface ElementorColumn {
  id: string;
  elType: "column";
  settings: Record<string, unknown>;
  elements: ElementorWidget[];
}

export interface ElementorSection {
  id: string;
  elType: "section";
  settings: Record<string, unknown>;
  elements: ElementorColumn[];
}

export interface ElementorTemplate {
  version: string;
  title: string;
  type: string;
  content: ElementorSection[];
  page_settings: Record<string, unknown>;
}
