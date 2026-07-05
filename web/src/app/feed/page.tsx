import type { Metadata } from "next";

import { loadDecisions, loadFindings } from "@/lib/data";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";

export const metadata: Metadata = { title: "The Feed" };

export default function FeedPage() {
  const findings = loadFindings();
  const decisions = loadDecisions();

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">The Feed</h1>
        <p className="text-ink-2 max-w-2xl">
          Weekly public output once the pipeline runs: new FOI responses, new deltas, appeals won.
          Auto-drafted, human-signed. Until then, this page shows the work as it assembles —
          findings in progress and the editorial decision log.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Findings in progress</h2>
        {findings.length === 0 && <p className="text-sm text-ink-2">None yet.</p>}
        <ul className="space-y-4">
          {findings.map((f) => (
            <li key={f.id} className="rounded border border-hairline bg-surface p-5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-sm">{f.title}</h3>
                {f.status === "published" ? (
                  <span className="text-xs text-ink-muted uppercase tracking-wide">published</span>
                ) : (
                  <UnverifiedBadge label={f.status} />
                )}
              </div>
              <p className="text-xs text-ink-2">
                Cites {f.claims.length} claims · rests on {f.models.length} model versions ·{" "}
                {f.reviewed_by ? `signed by ${f.reviewed_by}` : "unsigned — cannot publish (P6)"}
              </p>
              <p className="text-xs text-ink-muted">
                Full text with chained figures: <code className="text-[11px]">published/{f.dir}/finding.md</code>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Decision log</h2>
        <ul className="space-y-2">
          {decisions.map((d) => (
            <li key={d.file} className="text-sm text-ink-2">
              <span className="text-ink-muted tabular-nums mr-2">{d.file.slice(0, 4)}</span>
              {d.title.replace(/^\d+\s+—\s+/, "")}
              <span className="text-xs text-ink-muted ml-2">
                <code className="text-[11px]">decisions/{d.file}</code>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
