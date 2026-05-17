import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import { saveSession } from "@/lib/store";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert web designer and front-end developer.
When given a website description, you produce a single complete HTML file with:
- All CSS inlined in a <style> tag in <head>
- Modern, professional design with proper hierarchy and spacing
- Responsive layout using CSS Grid and Flexbox
- Realistic placeholder content (no Lorem Ipsum — use context-relevant copy)
- Real color palettes, not grey boxes
- The page should look like a real, polished website

Rules:
- Output ONLY raw HTML — no markdown, no code blocks, no explanation
- Do NOT use external CDN links or JavaScript frameworks
- Minimal JavaScript only if truly necessary (e.g. mobile nav toggle)
- Use Google Fonts via @import in the style tag
- Make it visually impressive — good typography, spacing, and color
- Include realistic images via https://placehold.co with descriptive alt text`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
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
          content: `Design this website: ${prompt.trim()}`,
        },
      ],
    });

    const html =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!html || !html.includes("<html")) {
      return NextResponse.json(
        { error: "Claude did not return valid HTML. Try rephrasing your prompt." },
        { status: 500 }
      );
    }

    // Extract title from HTML or use the prompt
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : prompt.slice(0, 60);

    const id = uuidv4();
    saveSession({ id, prompt: prompt.trim(), html, title, createdAt: Date.now() });

    return NextResponse.json({ id, title });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
