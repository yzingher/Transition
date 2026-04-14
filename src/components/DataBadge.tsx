"use client";

interface DataBadgeProps {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
}

const trendArrows = {
  up: "↑",
  down: "↓",
  stable: "→",
};

const trendColors = {
  up: "text-healthy",
  down: "text-danger",
  stable: "text-amber-500",
};

export default function DataBadge({ label, value, trend }: DataBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-navy-500/50 bg-navy-700/30">
      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="font-mono text-sm text-slate-100 font-medium">
        {value}
      </span>
      <span className={`font-mono text-sm ${trendColors[trend]}`}>
        {trendArrows[trend]}
      </span>
    </div>
  );
}
