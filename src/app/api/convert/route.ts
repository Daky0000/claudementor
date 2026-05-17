import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/store";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert in Elementor WordPress page builder.
Your job is to convert HTML/CSS website designs into valid Elementor template JSON that can be imported into Elementor.

Elementor JSON Structure:
{
  "version": "0.4",
  "title": "Page Title",
  "type": "page",
  "content": [ ...sections ],
  "page_settings": {}
}

Each SECTION (full-width row):
{
  "id": "unique8char",
  "elType": "section",
  "settings": {
    "background_background": "classic",
    "background_color": "#hex",
    "padding": { "top": "80", "right": "15", "bottom": "80", "left": "15", "unit": "px", "isLinked": false },
    "structure": "10"  // "10" = 1 col, "20" = 2 col equal, "33" = 3 col equal
  },
  "elements": [ ...columns ]
}

Each COLUMN:
{
  "id": "unique8char",
  "elType": "column",
  "settings": { "_column_size": 50 },  // percentage e.g. 100, 50, 33
  "elements": [ ...widgets ]
}

Widget types and their settings:

HEADING widget:
{ "id": "...", "elType": "widget", "widgetType": "heading", "settings": {
  "title": "Text here",
  "header_size": "h1",  // h1-h6
  "align": "center",    // left, center, right
  "title_color": "#hex",
  "typography_typography": "custom",
  "typography_font_size": { "size": 48, "unit": "px" },
  "typography_font_weight": "700"
}, "elements": [] }

TEXT-EDITOR widget:
{ "id": "...", "elType": "widget", "widgetType": "text-editor", "settings": {
  "editor": "<p>HTML content here</p>",
  "align": "left",
  "text_color": "#hex",
  "typography_typography": "custom",
  "typography_font_size": { "size": 16, "unit": "px" }
}, "elements": [] }

BUTTON widget:
{ "id": "...", "elType": "widget", "widgetType": "button", "settings": {
  "text": "Button Label",
  "align": "center",
  "background_color": "#hex",
  "button_text_color": "#fff",
  "border_radius": { "top": "6", "right": "6", "bottom": "6", "left": "6", "unit": "px" },
  "typography_font_size": { "size": 16, "unit": "px" },
  "typography_font_weight": "600",
  "padding": { "top": "14", "right": "32", "bottom": "14", "left": "32", "unit": "px" }
}, "elements": [] }

IMAGE widget:
{ "id": "...", "elType": "widget", "widgetType": "image", "settings": {
  "image": { "url": "https://placehold.co/800x500", "alt": "Description" },
  "align": "center",
  "width": { "size": 100, "unit": "%" }
}, "elements": [] }

ICON-BOX widget (icon + title + description card):
{ "id": "...", "elType": "widget", "widgetType": "icon-box", "settings": {
  "icon": { "value": "fas fa-star", "library": "fa-solid" },
  "title_text": "Feature Title",
  "description_text": "Description here",
  "title_color": "#hex",
  "description_color": "#hex"
}, "elements": [] }

DIVIDER widget:
{ "id": "...", "elType": "widget", "widgetType": "divider", "settings": {
  "color": "#e0e0e0",
  "gap": { "size": 24, "unit": "px" }
}, "elements": [] }

SPACER widget:
{ "id": "...", "elType": "widget", "widgetType": "spacer", "settings": {
  "space": { "size": 40, "unit": "px" }
}, "elements": [] }

HTML widget (use for complex/custom HTML blocks):
{ "id": "...", "elType": "widget", "widgetType": "html", "settings": {
  "html": "<div>custom html</div>"
}, "elements": [] }

Rules:
- Generate unique 8-character alphanumeric IDs for every id field (lowercase + digits only)
- Map each visible section of the HTML to one or more Elementor sections
- Choose column structure based on the layout (1, 2, or 3 columns)
- Extract real text, colors, and structure from the HTML
- Use heading widget for h1-h6, text-editor for paragraphs, button for CTAs, icon-box for feature cards
- Colors must be valid hex codes extracted from the CSS
- Output ONLY raw JSON — no markdown, no code fences, no explanation`;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Convert this HTML website into Elementor JSON. Page title: "${session.title}"\n\nHTML:\n${session.html}`,
        },
      ],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // Strip markdown code fences if Claude included them
    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let elementorJson;
    try {
      elementorJson = JSON.parse(jsonStr);
    } catch {
      // Claude returned invalid JSON — wrap what we have in a valid shell
      elementorJson = {
        version: "0.4",
        title: session.title,
        type: "page",
        content: [
          {
            id: generateId(),
            elType: "section",
            settings: { background_color: "#ffffff" },
            elements: [
              {
                id: generateId(),
                elType: "column",
                settings: { _column_size: 100 },
                elements: [
                  {
                    id: generateId(),
                    elType: "widget",
                    widgetType: "html",
                    settings: { html: session.html },
                    elements: [],
                  },
                ],
              },
            ],
          },
        ],
        page_settings: {},
      };
    }

    return NextResponse.json({ elementorJson });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
