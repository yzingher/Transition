"use client";

/**
 * Component cost breakdown at the current slider settings: single-series
 * horizontal bars (one hue, no legend), values at the bar tip, subtotal rows
 * excluded to avoid double counting.
 */

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export interface BreakdownRow {
  key: string;
  label: string;
  value: number;
}

export function Breakdown({ rows }: { rows: BreakdownRow[] }) {
  const leaves = rows.filter((r) => !r.key.includes("subtotal"));
  const max = Math.max(...leaves.map((r) => r.value), 1);
  const sorted = [...leaves].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-2">
      {sorted.map((row) => (
        <div key={row.key} className="grid grid-cols-[minmax(0,17rem)_1fr] items-center gap-3 text-sm">
          <span className="text-ink-2 truncate" title={row.label}>
            {row.label}
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-3.5 rounded-r shrink-0"
              style={{
                width: `${Math.max((row.value / max) * 100, 0.5)}%`,
                maxWidth: "calc(100% - 4.5rem)",
                background: "var(--accent)",
              }}
              title={`${row.label}: ${gbp.format(row.value)} per week`}
            />
            <span className="text-xs text-ink-muted tabular-nums whitespace-nowrap">{gbp.format(row.value)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
