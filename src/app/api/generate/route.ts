import { NextRequest, NextResponse } from "next/server";

function stripMarkdownFencing(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const { systemPrompt } = await req.json();

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return NextResponse.json(
        { error: "systemPrompt is required" },
        { status: 400 }
      );
    }

    // Sanitize API key: phones often replace -- with em-dash when pasting
    const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/[\u2010-\u2015\u2212]/g, "-");
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: "Generate the response now.",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    // Extract text content from Claude's response
    const textBlock = result.content?.find(
      (block: { type: string }) => block.type === "text"
    );
    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "No text in Anthropic response" },
        { status: 500 }
      );
    }

    const cleaned = stripMarkdownFencing(textBlock.text);
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
