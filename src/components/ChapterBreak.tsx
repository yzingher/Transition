"use client";

import { useState } from "react";
import { EvaluateChapterResponse, StrategicOption } from "@/engine/types";
import { getChapter } from "@/data/chapters";
import TypedText from "./TypedText";

interface ChapterBreakProps {
  chapter: number;
  nextChapter: number;
  evaluation: EvaluateChapterResponse;
  onSelectDirection: (option: StrategicOption) => void;
}

export default function ChapterBreak({
  chapter,
  nextChapter,
  evaluation,
  onSelectDirection,
}: ChapterBreakProps) {
  const [typingDone, setTypingDone] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const closingChapter = getChapter(chapter);
  const next = nextChapter <= 5 ? getChapter(nextChapter as 1 | 2 | 3 | 4 | 5) : null;

  return (
    <div className="flex-1 flex flex-col px-4 py-5 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-1">
          End of Chapter {chapter}
        </p>
        <h2 className="font-condensed text-2xl text-stone-100 uppercase tracking-wide">
          {closingChapter.title}
        </h2>
        <p className="font-mono text-[10px] text-stone-500 mt-1">
          {closingChapter.years}
        </p>
      </div>

      {/* Resolved consequences (brief) */}
      {evaluation.resolvedConsequences.length > 0 && (
        <div className="mb-4 p-3 rounded border border-amber/20 bg-amber/5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-amber/80 mb-2">
            Consequences Resolving
          </p>
          <div className="flex flex-col gap-2">
            {evaluation.resolvedConsequences.map((rc, i) => (
              <p key={i} className="text-xs text-stone-300 leading-relaxed">
                • {rc.narrative}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Briefing narrative */}
      <div className="mb-5">
        <TypedText
          text={evaluation.narrative}
          speed={4}
          onComplete={() => setTypingDone(true)}
          className="text-stone-100 text-[15px]"
        />
      </div>

      {typingDone && (
        <>
          {/* Economic data */}
          <div className="grid grid-cols-3 gap-2 mb-5 animate-[fadeIn_0.3s_ease-in]">
            <DataCell
              label="Unemployment"
              value={`${evaluation.economicIndicators.unemploymentRate.toFixed(1)}%`}
            />
            <DataCell
              label="GDP growth"
              value={`${evaluation.economicIndicators.gdpGrowth >= 0 ? "+" : ""}${evaluation.economicIndicators.gdpGrowth.toFixed(1)}%`}
            />
            <DataCell
              label="Gini"
              value={evaluation.economicIndicators.giniCoefficient.toFixed(1)}
            />
            <DataCell
              label="AI Adoption"
              value={`${evaluation.economicIndicators.aiAdoptionRate.toFixed(0)}%`}
            />
            <DataCell
              label="Talent flow"
              value={`${evaluation.economicIndicators.netTalentFlow >= 0 ? "+" : ""}${evaluation.economicIndicators.netTalentFlow.toFixed(1)}`}
            />
            <DataCell
              label="Trust"
              value={evaluation.economicIndicators.publicTrustIndex.toFixed(0)}
            />
          </div>

          {/* Strategic question */}
          {next && (
            <div className="mb-3 animate-[fadeIn_0.3s_ease-in]">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-1 text-center">
                Next Chapter: {next.title}
              </p>
              <p className="text-[15px] text-amber italic leading-relaxed text-center mb-4">
                &ldquo;{evaluation.strategicQuestion.prompt}&rdquo;
              </p>

              <div className="flex flex-col gap-2">
                {evaluation.strategicQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedId(opt.id)}
                    className={`text-left p-3 rounded border transition-all ${
                      selectedId === opt.id
                        ? "border-amber bg-amber/10"
                        : "border-stone-700/60 bg-stone-900/40 hover:border-stone-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-amber/80">
                        {opt.label}
                      </span>
                      <span className="font-mono text-[9px] uppercase text-stone-500">
                        {opt.leansToward}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const opt = evaluation.strategicQuestion.options.find(
                    (o) => o.id === selectedId
                  );
                  if (opt) onSelectDirection(opt);
                }}
                disabled={!selectedId}
                className={`mt-4 w-full py-3 rounded font-mono text-xs uppercase tracking-wider transition-all ${
                  selectedId
                    ? "border border-amber/50 bg-amber/15 text-amber hover:bg-amber/25 btn-glow"
                    : "border border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed"
                }`}
              >
                Set Direction →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded border border-stone-800 bg-stone-900/40 text-center">
      <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500 mb-0.5">
        {label}
      </p>
      <p className="font-mono text-sm text-stone-100 tabular-nums">{value}</p>
    </div>
  );
}
