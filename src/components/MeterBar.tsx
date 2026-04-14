"use client";

interface MeterBarProps {
  label: string;
  value: number;
  dangerThreshold: number;
  warningThreshold?: number;
}

export default function MeterBar({
  label,
  value,
  dangerThreshold,
  warningThreshold = 30,
}: MeterBarProps) {
  const isDanger = value <= dangerThreshold;
  const isWarning = value <= warningThreshold;

  const barColor = isDanger
    ? "bg-danger"
    : isWarning
      ? "bg-warning"
      : "bg-healthy";

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-navy-600 rounded-full overflow-hidden">
        <div
          className={`meter-fill h-full rounded-full ${barColor} ${isDanger ? "danger-pulse" : ""}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={`font-mono text-xs w-8 text-right ${
          isDanger ? "text-danger" : isWarning ? "text-warning" : "text-slate-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
