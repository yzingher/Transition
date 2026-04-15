import {
  ChapterStartResponse,
  EvaluateChapterResponse,
  ReckoningResponse,
} from "./types";

async function callLLM<T>(systemPrompt: string): Promise<T> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}

export function generateChapterStart(
  systemPrompt: string
): Promise<ChapterStartResponse> {
  return callLLM<ChapterStartResponse>(systemPrompt);
}

export function evaluateChapter(
  systemPrompt: string
): Promise<EvaluateChapterResponse> {
  return callLLM<EvaluateChapterResponse>(systemPrompt);
}

export function generateReckoning(
  systemPrompt: string
): Promise<ReckoningResponse> {
  return callLLM<ReckoningResponse>(systemPrompt);
}
