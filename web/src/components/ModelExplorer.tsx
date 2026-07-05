"use client";

/**
 * P2 — assumptions are sliders, not assertions. Every parameter is adjustable
 * within its sourced bounds only; the should-cost recomputes live in the
 * browser with the same deterministic engine CI runs (golden-pinned to the
 * Python engine). Nothing here can go outside a cited claim's range.
 */
import { useMemo, useState } from "react";

import {
  evaluateRange,
  evaluateScenario,
  midValues,
  type CostModelDef,
} from "@/lib/engine";
import { Breakdown } from "@/components/Breakdown";
import { RangeStrip } from "@/components/RangeStrip";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export interface ParamProvenance {
  claimId: string;
  statement: string;
  sourceTitle: string;
  sourceUrl: string | null;
  claimStatus: string;
}

export interface DoesCostFixture {
  value: number;
  label: string;
  claimId: string;
}

const gbpFine = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatValue(value: number, unit: string): string {
  if (unit.startsWith("GBP")) return Math.abs(value) < 100 ? gbpFine.format(value) : gbp.format(value);
  if (unit === "ratio") return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, ".0");
  return `${Number(value.toFixed(2))}`;
}

export function ModelExplorer({
  model,
  provenance,
  doesCost,
}: {
  model: CostModelDef;
  provenance: Record<string, ParamProvenance[]>;
  doesCost?: DoesCostFixture | null;
}) {
  const defaults = useMemo(() => midValues(model), [model]);
  const [values, setValues] = useState<Record<string, number>>(defaults);
  const range = useMemo(() => evaluateRange(model), [model]);
  const scenario = useMemo(() => evaluateScenario(model, values), [model, values]);
  const current = scenario[model.primary_output];
  const isDefault = model.parameters.every((p) => values[p.key] === defaults[p.key]);

  const breakdownRows = model.components.map((c) => ({
    key: c.key,
    label: c.label,
    value: scenario[c.key],
  }));

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Should-cost per {model.unit.replace("GBP/", "")}
        </h2>
        <RangeStrip
          p10={range.p10}
          p50={range.p50}
          p90={range.p90}
          unit={model.unit}
          current={isDefault ? null : current}
          doesCost={doesCost ? { value: doesCost.value, label: doesCost.label } : null}
        />
        <p className="text-xs text-ink-muted max-w-prose">
          Bounds are full-correlation scenarios — every assumption simultaneously at its
          cost-minimising (or -maximising) sourced limit — wider than sampled percentiles,
          which is the conservative direction. Method: models/SCHEMA.md.
        </p>
        {doesCost && (
          <p className="text-sm text-ink-2 max-w-prose">
            {doesCost.value > range.p90 ? (
              <>
                The {doesCost.label} sits {gbp.format(doesCost.value - range.p90)} per week above
                even the most generous end of the should-cost range — an unexplained cost delta
                until an explanation is sought.
              </>
            ) : (
              <>
                The {doesCost.label} falls inside the should-cost scenario bounds — no delta is
                claimed at these assumptions.
              </>
            )}{" "}
            <UnverifiedBadge label="synthetic fixture" />
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Assumptions — adjustable within sourced bounds
          </h2>
          <button
            type="button"
            onClick={() => setValues(defaults)}
            disabled={isDefault}
            className="text-xs text-ink-2 underline underline-offset-2 disabled:opacity-40 disabled:no-underline"
          >
            reset to central
          </button>
        </div>
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {model.parameters
            .filter((p) => p.range.low !== p.range.high)
            .map((p) => {
              const prov = provenance[p.key] ?? [];
              const step = (p.range.high - p.range.low) / 100;
              return (
                <div key={p.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <label htmlFor={`param-${p.key}`} className="text-ink-2">
                      {p.label}
                    </label>
                    <span className="tabular-nums font-medium">
                      {formatValue(values[p.key], p.unit)}
                    </span>
                  </div>
                  <input
                    id={`param-${p.key}`}
                    type="range"
                    min={p.range.low}
                    max={p.range.high}
                    step={step}
                    value={values[p.key]}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))
                    }
                  />
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="tabular-nums">
                      {formatValue(p.range.low, p.unit)} – {formatValue(p.range.high, p.unit)}
                    </span>
                    {prov.map((pr) => (
                      <span key={pr.claimId} title={`${pr.statement} — ${pr.sourceTitle}`}>
                        {pr.claimStatus === "verified" ? (
                          <span className="text-ink-muted">{pr.claimId}</span>
                        ) : (
                          <UnverifiedBadge />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Weekly cost breakdown at your settings
        </h2>
        <Breakdown rows={breakdownRows} />
        <p className="text-sm text-ink-2">
          Total {gbp.format(scenario[model.outputs[0].key])} per week
          {model.outputs.length > 1 && <> · {gbp.format(current)} per occupied place-week</>}
        </p>
      </section>
    </div>
  );
}
