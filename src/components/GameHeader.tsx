"use client";

import MeterBar from "./MeterBar";
import ResourcePill from "./ResourcePill";

interface GameHeaderProps {
  turn: number;
  year: string;
  phase: 1 | 2 | 3;
  stability: number;
  relevance: number;
  political_capital: number;
  budget: number;
  talent: number;
}

export default function GameHeader({
  turn,
  year,
  phase,
  stability,
  relevance,
  political_capital,
  budget,
  talent,
}: GameHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-sm border-b border-navy-600/50 px-4 py-3">
      {/* Turn indicator */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-amber-500 text-xs font-semibold">
            TURN {turn}/12
          </span>
          <span className="font-mono text-slate-400 text-xs">
            {year}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Phase {phase}
        </span>
      </div>

      {/* Meters */}
      <div className="flex flex-col gap-1.5 mb-2.5">
        <MeterBar
          label="Stability"
          value={stability}
          dangerThreshold={15}
          warningThreshold={30}
        />
        <MeterBar
          label="Relevance"
          value={relevance}
          dangerThreshold={10}
          warningThreshold={25}
        />
      </div>

      {/* Resources */}
      <div className="flex gap-1.5 flex-wrap">
        <ResourcePill label="Capital" value={political_capital} icon="⚡" />
        <ResourcePill label="Budget" value={budget} icon="£" />
        <ResourcePill label="Talent" value={talent} icon="◆" />
      </div>
    </header>
  );
}
