import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert web designer. You receive an existing HTML website and a refinement instruction.
Apply the instruction precisely while keeping everything else intact.
Output ONLY the complete updated HTML — no markdown, no code blocks, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const { html, instruction } = await req.json();

    if (!html || !instruction?.trim()) {
      return NextResponse.json({ error: "html and instruction are required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the current HTML:\n\n${html}\n\nRefinement instruction: ${instruction.trim()}`,
        },
      ],
    });

    const updatedHtml = message.content[0].type === "text" ? message.content[0].text : "";

    if (!updatedHtml || !updatedHtml.includes("<html")) {
      return NextResponse.json({ error: "Refinement failed — try rephrasing your instruction" }, { status: 500 });
    }

    return NextResponse.json({ html: updatedHtml });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
