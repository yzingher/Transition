"use client";

import { Resources } from "@/engine/types";

interface ResourceBarProps {
  resources: Resources;
  onOpen: () => void;
}

export default function ResourceBar({ resources, onOpen }: ResourceBarProps) {
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center justify-between px-3 py-1.5 rounded border border-stone-700/60 bg-stone-900/60 hover:bg-stone-800/60 transition-colors"
      aria-label="Open resource dashboard"
    >
      <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
        <ResourcePill icon="£" label="BUD" value={resources.budget} color="#c4a95c" />
        <ResourcePill icon="◆" label="TAL" value={resources.talent} color="#6b9e6b" />
        <ResourcePill icon="⬡" label="COM" value={resources.compute} color="#8e9eb4" />
      </div>
      <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
        Details ↑
      </span>
    </button>
  );
}

function ResourcePill({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  const isLow = value <= 20;
  return (
    <span className="flex items-center gap-1">
      <span style={{ color }}>{icon}</span>
      <span className="text-stone-500 text-[9px] uppercase tracking-widest">
        {label}
      </span>
      <span
        className="font-semibold"
        style={{ color: isLow ? "#c45c5c" : color }}
      >
        {Math.round(value)}
      </span>
    </span>
  );
}
