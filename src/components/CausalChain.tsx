"use client";

import { Decision } from "@/engine/types";

interface CausalChainProps {
  decisions: Decision[];
}

function actionBadge(action: string): { label: string; colour: string } {
  if (action === "approve") return { label: "APPROVED", colour: "#6b9e6b" };
  if (action === "reject") return { label: "REJECTED", colour: "#c45c5c" };
  return { label: "DEFERRED", colour: "#8e9eb4" };
}

export default function CausalChain({ decisions }: CausalChainProps) {
  if (decisions.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center italic">
        No decisions recorded.
      </p>
    );
  }

  // Group by chapter
  const byChapter: Record<number, Decision[]> = {};
  for (const d of decisions) {
    if (!byChapter[d.chapter]) byChapter[d.chapter] = [];
    byChapter[d.chapter].push(d);
  }
  const chapters = Object.keys(byChapter)
    .map((n) => parseInt(n))
    .sort((a, b) => a - b);

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-stone-800" />

      {chapters.map((chNum) => (
        <div key={chNum} className="mb-4">
          <div className="flex items-center gap-2 mb-2 ml-8">
            <span className="font-mono text-[10px] uppercase tracking-widest text-amber">
              Chapter {chNum}
            </span>
            <span className="h-px flex-1 bg-stone-800" />
            <span className="font-mono text-[9px] text-stone-500">
              {byChapter[chNum].length} decisions
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {byChapter[chNum].map((d, i) => {
              const badge = actionBadge(d.action);
              // Only show approve/reject; skip human_moment approvals
              if (d.cardText === "" || d.cardId.includes("human_moment")) return null;
              return (
                <div key={i} className="flex gap-3 ml-0">
                  <div className="relative z-10 w-6 flex justify-center pt-2 shrink-0">
                    <div
                      className="w-2 h-2 rounded-full ring-2"
                      style={{
                        backgroundColor: badge.colour,
                        boxShadow: `0 0 0 2px rgba(10,10,15,0.9)`,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span
                        className="font-mono text-[9px] font-semibold"
                        style={{ color: badge.colour }}
                      >
                        {badge.label}
                      </span>
                      <span className="font-mono text-[9px] text-stone-500">
                        {d.from}
                      </span>
                    </div>
                    <p className="text-[12px] text-stone-300 leading-snug italic">
                      &ldquo;{d.cardText.slice(0, 140)}
                      {d.cardText.length > 140 ? "…" : ""}&rdquo;
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(d.effectsApplied)
                        .filter(([, v]) => v !== 0 && v !== undefined)
                        .map(([k, v]) => (
                          <span
                            key={k}
                            className={`font-mono text-[9px] ${
                              (v as number) > 0 ? "text-emerald-400/70" : "text-red-400/70"
                            }`}
                          >
                            {k.toUpperCase().slice(0, 3)} {(v as number) > 0 ? "+" : ""}
                            {v as number}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
