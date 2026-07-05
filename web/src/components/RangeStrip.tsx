"use client";

/**
 * Should-cost range strip: P10–P90 band (series 1, wash) with a P50 tick,
 * plus optional markers for "your assumptions" (series 1, solid) and a
 * does-cost comparison (series 8). All values direct-labelled; identity is
 * never colour-alone (legend below).
 */

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export interface RangeStripProps {
  p10: number;
  p50: number;
  p90: number;
  unit: string;
  current?: number | null;
  doesCost?: { value: number; label: string } | null;
}

export function RangeStrip({ p10, p50, p90, unit, current, doesCost }: RangeStripProps) {
  const values = [p10, p90, current ?? p50, doesCost?.value ?? p50];
  const max = Math.max(...values) * 1.08;
  const min = 0;
  const x = (v: number) => `${((v - min) / (max - min)) * 100}%`;

  return (
    <figure className="space-y-2">
      <div className="relative h-24">
        {/* baseline track */}
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "var(--baseline)" }} />
        {/* P10–P90 band */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-6 rounded"
          style={{ left: x(p10), width: `calc(${x(p90)} - ${x(p10)})`, background: "var(--accent-wash)" }}
          title={`Should-cost scenario bounds: ${gbp.format(p10)} to ${gbp.format(p90)} ${unit}`}
        />
        {/* P50 tick */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-6 w-0.5"
          style={{ left: x(p50), background: "var(--accent)" }}
          title={`Central should-cost ${gbp.format(p50)} ${unit}`}
        />
        {/* band edge labels */}
        <span className="absolute top-[68%] -translate-x-1/2 text-[11px] text-ink-muted tabular-nums" style={{ left: x(p10) }}>
          {gbp.format(p10)}
        </span>
        <span className="absolute top-[68%] -translate-x-1/2 text-[11px] text-ink-muted tabular-nums" style={{ left: x(p90) }}>
          {gbp.format(p90)}
        </span>
        <span className="absolute top-[2%] -translate-x-1/2 text-[11px] text-ink-2 tabular-nums" style={{ left: x(p50) }}>
          {gbp.format(p50)}
        </span>
        {/* your-assumptions marker */}
        {current != null && Math.abs(current - p50) > (p90 - p10) / 200 && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full"
              style={{ left: x(current), background: "var(--accent)", border: "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--accent)" }}
              title={`At your slider settings: ${gbp.format(current)} ${unit}`}
            />
            <span className="absolute top-[2%] -translate-x-1/2 text-[11px] font-medium text-ink tabular-nums" style={{ left: x(current) }}>
              {gbp.format(current)}
            </span>
          </>
        )}
        {/* does-cost marker */}
        {doesCost && (
          <>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45"
              style={{ left: x(doesCost.value), background: "var(--does)", border: "2px solid var(--surface)", boxShadow: "0 0 0 1px var(--does)" }}
              title={`${doesCost.label}: ${gbp.format(doesCost.value)} ${unit}`}
            />
            <span className="absolute top-[82%] -translate-x-1/2 text-[11px] text-ink-2 tabular-nums whitespace-nowrap" style={{ left: x(doesCost.value) }}>
              {gbp.format(doesCost.value)}
            </span>
          </>
        )}
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "var(--accent-wash)", boxShadow: "inset 0 0 0 1px var(--accent)" }} />
          should-cost scenario bounds (central tick)
        </span>
        {current != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }} />
            your assumptions
          </span>
        )}
        {doesCost && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rotate-45" style={{ background: "var(--does)" }} />
            {doesCost.label}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
