"use client";

import { useState } from "react";
import { DecisionResponse } from "@/engine/types";
import TypedText from "./TypedText";

interface ConsequenceScreenProps {
  decision: DecisionResponse;
  onNextTurn: () => void;
}

export default function ConsequenceScreen({
  decision,
  onNextTurn,
}: ConsequenceScreenProps) {
  const [typingDone, setTypingDone] = useState(false);

  const effects = decision.immediate_effects;
  const effectEntries = Object.entries(effects).filter(
    ([, val]) => val !== 0
  ) as [string, number][];

  return (
    <div className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
      {/* Consequence narrative */}
      <TypedText
        text={decision.narrative}
        speed={8}
        onComplete={() => setTypingDone(true)}
        className="text-slate-100 text-[15px] mb-5"
      />

      {typingDone && (
        <div className="animate-[fadeIn_0.3s_ease-in]">
          {/* Immediate effects */}
          {effectEntries.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                Immediate Effects
              </p>
              <div className="flex flex-wrap gap-2">
                {effectEntries.map(([key, val]) => (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-xs ${
                      val > 0
                        ? "bg-healthy/10 text-healthy border border-healthy/20"
                        : "bg-danger/10 text-danger border border-danger/20"
                    }`}
                  >
                    {formatLabel(key)}{" "}
                    {val > 0 ? "+" : ""}
                    {val}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preview hints for delayed consequences */}
          {decision.delayed_consequences.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                Still Unfolding...
              </p>
              <div className="flex flex-col gap-2">
                {decision.delayed_consequences.map((dc, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-2 rounded border border-amber-500/20 bg-amber-500/5"
                  >
                    <span className="text-amber-500/60 text-xs mt-0.5">◈</span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      {dc.preview_hint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New policies */}
          {decision.new_policies.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                New Policies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {decision.new_policies.map((policy, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full font-mono text-[10px] border border-navy-500/50 bg-navy-700/30 text-slate-300"
                  >
                    {policy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Next turn button */}
          <button
            onClick={onNextTurn}
            className="btn-glow w-full py-3.5 rounded border border-amber-500/50 bg-amber-500/10
              text-amber-500 font-mono text-sm uppercase tracking-wider
              hover:bg-amber-500/20 active:scale-[0.98] transition-all mt-2"
          >
            Next Turn →
          </button>
        </div>
      )}
    </div>
  );
}

function formatLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
