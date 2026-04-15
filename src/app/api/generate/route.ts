import { NextRequest, NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

function stripMarkdownFencing(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

function parseLLMJson(text: string): unknown {
  const cleaned = stripMarkdownFencing(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    // Open-source models often emit slightly malformed JSON.
    // jsonrepair handles missing commas, trailing commas, unclosed arrays, etc.
    const repaired = jsonrepair(cleaned);
    return JSON.parse(repaired);
  }
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  strictness: "normal" | "strict"
): Promise<string> {
  const userMessage =
    strictness === "normal"
      ? "Generate the response now. Return ONLY the raw JSON object — no markdown fencing, no prose before or after, no code blocks."
      : "Generate the response now. CRITICAL: Return ONLY a single valid JSON object. Every string must be quoted. Every object key must be quoted. Every array element must be comma-separated. Close every bracket and brace. Do not emit markdown, prose, or code fences. Verify your JSON is syntactically valid before emitting.";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://transition-kappa.vercel.app",
        "X-Title": "The Transition",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2",
        max_tokens: 8000,
        temperature: strictness === "strict" ? 0.4 : 0.7,
        provider: { sort: "throughput" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error: ${response.status} ${errorText.slice(0, 200)}`
    );
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("No content in OpenRouter response");
  }
  return content;
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

    // First attempt
    let content = await callOpenRouter(apiKey, systemPrompt, "normal");
    try {
      const parsed = parseLLMJson(content);
      return NextResponse.json(parsed);
    } catch (firstErr) {
      console.warn("First JSON parse failed, retrying with strict mode:", firstErr);
    }

    // Retry with lower temperature and stricter instructions
    content = await callOpenRouter(apiKey, systemPrompt, "strict");
    try {
      const parsed = parseLLMJson(content);
      return NextResponse.json(parsed);
    } catch (secondErr) {
      console.error("Second JSON parse also failed:", secondErr);
      return NextResponse.json(
        {
          error: `LLM returned unparseable JSON after retry: ${
            secondErr instanceof Error ? secondErr.message : "unknown"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Generate API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
