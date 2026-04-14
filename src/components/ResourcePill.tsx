"use client";

interface ResourcePillProps {
  label: string;
  value: number;
  icon: string;
}

export default function ResourcePill({ label, value, icon }: ResourcePillProps) {
  const isLow = value <= 20;
  const isCritical = value <= 10;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
        isCritical
          ? "border-danger/40 bg-danger/10"
          : isLow
            ? "border-warning/30 bg-warning/5"
            : "border-navy-500/50 bg-navy-700/50"
      }`}
    >
      <span className="text-xs">{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span
        className={`font-mono text-xs font-medium ${
          isCritical
            ? "text-danger"
            : isLow
              ? "text-warning"
              : "text-slate-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
