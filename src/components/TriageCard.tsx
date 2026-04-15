"use client";

import { TriageCard as TriageCardType } from "@/engine/types";
import { canAfford } from "@/engine/resourceLogic";
import { Resources } from "@/engine/types";

interface TriageCardProps {
  card: TriageCardType;
  resources: Resources;
  onApprove: () => void;
  onReject: () => void;
  onDefer: () => void;
  disabled?: boolean;
  exitDirection?: "left" | "right" | "down" | null;
}

function weightLabel(weight: string): string {
  if (weight === "gut_punch") return "Critical";
  if (weight === "interesting") return "Significant";
  return "Routine";
}
function weightColour(weight: string): string {
  if (weight === "gut_punch") return "#c45c5c";
  if (weight === "interesting") return "#e8a84c";
  return "#8e9eb4";
}

export default function TriageCard({
  card,
  resources,
  onApprove,
  onReject,
  onDefer,
  disabled,
  exitDirection,
}: TriageCardProps) {
  const affordable = canAfford(resources, card.cost);

  const transform =
    exitDirection === "left"
      ? "translate-x-[-120%] rotate-[-8deg] opacity-0"
      : exitDirection === "right"
        ? "translate-x-[120%] rotate-[8deg] opacity-0"
        : exitDirection === "down"
          ? "translate-y-[60%] opacity-0"
          : "";

  return (
    <div
      className={`flex-1 flex flex-col rounded-lg border border-stone-700/60 bg-stone-900/70 overflow-hidden transition-all duration-300 ${transform}`}
    >
      {/* Weight strip */}
      <div
        className="h-0.5"
        style={{ backgroundColor: weightColour(card.weight) }}
      />

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
            From
          </span>
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: weightColour(card.weight) }}
          >
            {weightLabel(card.weight)}
          </span>
        </div>
        <p className="font-mono text-xs text-amber mb-3 uppercase tracking-wide">
          {card.from}
        </p>

        <p className="text-[15px] text-stone-100 leading-relaxed mb-4">
          &ldquo;{card.text}&rdquo;
        </p>

        {/* Costs & gates */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(card.cost.budget ?? 0) > 0 && (
            <CostPill label="Budget" value={`-${card.cost.budget}`} color="#c4a95c" />
          )}
          {(card.cost.talent ?? 0) > 0 && (
            <CostPill label="Talent" value={`-${card.cost.talent}`} color="#6b9e6b" />
          )}
          {(card.cost.compute ?? 0) > 0 && (
            <CostPill label="Compute" value={`-${card.cost.compute}`} color="#8e9eb4" />
          )}
          {card.gate && (
            <CostPill
              label={`Requires ${card.gate.resource}`}
              value={`≥ ${card.gate.minimum}`}
              color="#e8a84c"
            />
          )}
        </div>

        {/* Uncertainty note */}
        {card.uncertaintyNote && (
          <p className="text-xs text-stone-400 italic mb-2 border-l border-stone-700 pl-2">
            {card.uncertaintyNote}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-800">
          <span className="font-mono text-[9px] uppercase tracking-widest text-stone-500">
            Outcome certainty
          </span>
          <span
            className="font-mono text-[10px] tabular-nums"
            style={{
              color:
                card.uncertainty === "low"
                  ? "#6b9e6b"
                  : card.uncertainty === "moderate"
                    ? "#e8a84c"
                    : "#c45c5c",
            }}
          >
            {card.uncertainty.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-stone-800 bg-stone-950/40 p-3">
        {!affordable && (
          <p className="text-[10px] font-mono text-red-400 mb-2 text-center">
            You can&apos;t afford this. You can REJECT or DEFER.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            disabled={disabled}
            onClick={onReject}
            className="py-3 rounded border border-stone-700 bg-stone-800/40 text-stone-200 font-mono text-xs uppercase tracking-wider hover:bg-stone-700/40 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Reject
          </button>
          <button
            disabled={disabled || !affordable}
            onClick={onApprove}
            className={`py-3 rounded font-mono text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-40 ${
              affordable
                ? "border border-amber/50 bg-amber/15 text-amber hover:bg-amber/25 btn-glow"
                : "border border-stone-800 bg-stone-900 text-stone-500"
            }`}
          >
            Approve
          </button>
        </div>
        <button
          disabled={disabled || !card.canDefer}
          onClick={onDefer}
          className="w-full py-2 rounded border border-stone-800 bg-transparent text-stone-400 font-mono text-[11px] uppercase tracking-wider hover:text-stone-200 disabled:opacity-30 transition-colors"
        >
          Defer →
        </button>
      </div>
    </div>
  );
}

function CostPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono"
      style={{
        backgroundColor: `${color}20`,
        border: `1px solid ${color}50`,
        color,
      }}
    >
      <span className="uppercase tracking-wider text-[9px]">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}
