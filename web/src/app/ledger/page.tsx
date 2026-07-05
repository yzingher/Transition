import type { Metadata } from "next";
import Link from "next/link";

import { loadClaims, loadModels, loadSources } from "@/lib/data";
import { UnverifiedBadge } from "@/components/UnverifiedBadge";

export const metadata: Metadata = { title: "The Ledger" };

export default function LedgerPage() {
  const models = loadModels();
  const claims = loadClaims();
  const sources = loadSources();

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">The Ledger</h1>
        <p className="text-ink-2 max-w-2xl">
          The browsable evidence base. Every model is a file anyone can dispute by pull request;
          every parameter cites a claim; every claim cites a source. Assumptions are sliders,
          adjustable within their sourced bounds.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Cost models</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {models.map((model) => (
            <Link
              key={model.id}
              href={`/ledger/models/${model.id}`}
              className="rounded border border-hairline bg-surface p-5 space-y-2 hover:border-baseline"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-sm">{model.title}</h3>
                <span className="text-[11px] text-ink-muted whitespace-nowrap">
                  v{model.version} · {model.status}
                </span>
              </div>
              <p className="text-xs text-ink-2 line-clamp-3">{model.description}</p>
              <p className="text-[11px] text-ink-muted">
                {model.parameters.length} sourced parameters · unit {model.unit}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Source registry</h2>
        <p className="text-sm text-ink-2 max-w-2xl">
          A source becomes <em>verified</em> only when the actual document has been retrieved and
          SHA-256 hashed. A claim becomes verified only when a human has checked it against that
          document. Currently: <strong>{sources.filter((s) => s.status === "verified").length} of {sources.length}</strong>{" "}
          sources verified, <strong>{claims.filter((c) => c.status === "verified").length} of {claims.length}</strong> claims verified.
        </p>
        <div className="overflow-x-auto rounded border border-hairline">
          <table className="w-full bg-surface text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted border-b border-hairline">
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Publisher</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-hairline last:border-0 align-top">
                  <td className="px-4 py-2.5">
                    {source.url ? (
                      <a href={source.url} className="underline underline-offset-2 decoration-baseline hover:decoration-ink" rel="noopener noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{source.publisher ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {source.status === "verified" ? (
                      <span className="text-xs">verified</span>
                    ) : (
                      <UnverifiedBadge label="placeholder" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
