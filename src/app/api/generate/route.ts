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

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://transition-kappa.vercel.app",
        "X-Title": "The Transition",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2",
        max_tokens: 2500,
        temperature: 0.8,
        response_format: { type: "json_object" },
        provider: {
          sort: "throughput",
        },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the response now." },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} ${errorText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    const content = result.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "No content in OpenRouter response" },
        { status: 500 }
      );
    }

    const cleaned = stripMarkdownFencing(content);
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
