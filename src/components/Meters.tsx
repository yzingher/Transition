"use client";

import { Meters as MetersType } from "@/engine/types";

interface MetersProps {
  meters: MetersType;
}

function meterBarColor(
  value: number,
  healthy: string,
  warning: string,
  danger: string,
  dangerAt: number,
  warningAt: number
): string {
  if (value <= dangerAt) return danger;
  if (value <= warningAt) return warning;
  return healthy;
}

export default function Meters({ meters }: MetersProps) {
  const stabilityColor = meterBarColor(
    meters.stability,
    "#4a9e8e",
    "#d4915c",
    "#c45c5c",
    15,
    30
  );
  const relevanceColor = meterBarColor(
    meters.relevance,
    "#5a7c9e",
    "#d4915c",
    "#c45c5c",
    15,
    30
  );

  return (
    <div className="flex flex-col gap-1.5">
      <MeterRow
        label="Stability"
        value={meters.stability}
        color={stabilityColor}
        pulseIfBelow={15}
      />
      <MeterRow
        label="Relevance"
        value={meters.relevance}
        color={relevanceColor}
        pulseIfBelow={15}
      />
    </div>
  );
}

function MeterRow({
  label,
  value,
  color,
  pulseIfBelow,
}: {
  label: string;
  value: number;
  color: string;
  pulseIfBelow: number;
}) {
  const isCritical = value <= pulseIfBelow;
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400 w-[72px] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
        <div
          className={`meter-fill h-full rounded-full ${isCritical ? "danger-pulse" : ""}`}
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span
        className="font-mono text-[11px] tabular-nums w-7 text-right"
        style={{ color }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}
