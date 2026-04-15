"use client";

import { useEffect, useState } from "react";
import { Effects } from "@/engine/types";

interface MeterDeltaToastProps {
  effects: Effects | null;
}

// Flies in briefly when meters/resources change. Consumed by orchestrator
// passing new effects. Auto-hides after ~2s.
export default function MeterDeltaToast({ effects }: MeterDeltaToastProps) {
  const [displayed, setDisplayed] = useState<Effects | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!effects) return;
    const hasAny = Object.values(effects).some((v) => v !== 0 && v !== undefined);
    if (!hasAny) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setDisplayed(effects);
    setVisible(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [effects]);

  if (!displayed) return null;

  const entries = Object.entries(displayed).filter(
    ([, v]) => v !== 0 && v !== undefined
  ) as [string, number][];

  const labelMap: Record<string, string> = {
    stability: "STB",
    relevance: "REL",
    budget: "BUD",
    talent: "TAL",
    compute: "COM",
  };
  const colorMap: Record<string, string> = {
    stability: "#4a9e8e",
    relevance: "#5a7c9e",
    budget: "#c4a95c",
    talent: "#6b9e6b",
    compute: "#8e9eb4",
  };

  return (
    <div
      className={`pointer-events-none fixed top-[130px] left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="flex gap-1.5 px-3 py-1.5 rounded-full bg-stone-950/90 border border-stone-800 backdrop-blur-sm">
        {entries.map(([key, val]) => (
          <span
            key={key}
            className="font-mono text-[10px] tabular-nums"
            style={{ color: colorMap[key] ?? "#e8e4df" }}
          >
            {labelMap[key]} {val > 0 ? "+" : ""}
            {val}
          </span>
        ))}
      </div>
    </div>
  );
}
