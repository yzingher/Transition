import { BriefingResponse, DecisionResponse, EndGameResponse } from "./types";

function stripMarkdownFencing(text: string): string {
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

export async function callLLM<T>(systemPrompt: string): Promise<T> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  return data as T;
}

export async function generateBriefing(
  systemPrompt: string
): Promise<BriefingResponse> {
  return callLLM<BriefingResponse>(systemPrompt);
}

export async function generateDecision(
  systemPrompt: string
): Promise<DecisionResponse> {
  return callLLM<DecisionResponse>(systemPrompt);
}

export async function generateEndGame(
  systemPrompt: string
): Promise<EndGameResponse> {
  return callLLM<EndGameResponse>(systemPrompt);
}
