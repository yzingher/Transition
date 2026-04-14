"use client";

import { DecisionRecord } from "@/engine/types";

interface CausalChainProps {
  decisions: DecisionRecord[];
}

export default function CausalChain({ decisions }: CausalChainProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-navy-500/50" />

      <div className="flex flex-col gap-4">
        {decisions.map((d, i) => (
          <div key={i} className="flex gap-4 relative">
            {/* Dot */}
            <div className="relative z-10 mt-1.5 w-6 h-6 flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80 ring-2 ring-amber-500/20" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono text-[10px] text-amber-500 font-semibold">
                  T{d.turn}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {d.year}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-100 mb-0.5">
                {d.event_title}
              </p>
              <p className="text-xs text-slate-300 mb-1">
                Chose: <span className="text-amber-500/80">{d.chosen_label}</span>
              </p>
              {/* Effect summary */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(d.immediate_effects)
                  .filter(([, val]) => val !== 0)
                  .map(([key, val]) => (
                    <span
                      key={key}
                      className={`font-mono text-[10px] ${
                        (val as number) > 0 ? "text-healthy/70" : "text-danger/70"
                      }`}
                    >
                      {formatKey(key)} {(val as number) > 0 ? "+" : ""}
                      {val as number}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatKey(key: string): string {
  const map: Record<string, string> = {
    stability: "STB",
    relevance: "REL",
    political_capital: "CAP",
    budget: "BDG",
    talent: "TLN",
  };
  return map[key] ?? key.toUpperCase().slice(0, 3);
}
