import Link from "next/link";

import { loadClaims, loadFindings, loadModels, loadSources } from "@/lib/data";

const PRINCIPLES: [string, string][] = [
  ["No claim without a chain", "Every published number links to source documents, the calculation, and the model version that produced it. CI blocks anything less."],
  ["Assumptions are sliders, not assertions", "Staffing ratios, wages, and overheads are adjustable within sourced bounds. Deltas are shown surviving the most generous assumptions."],
  ["Conservative by construction", "Where a range exists, the low end of the delta is published. Gross, realistically recoverable, and by-year figures are always separated."],
  ["Language discipline", "Unexplained cost delta — never an accusation. Named organisations get the analysis 14 days early and their response publishes verbatim."],
  ["Everything public", "Code, models, prompts, FOI correspondence, editorial decisions: one public repository."],
  ["AI drafts, humans sign", "No model output reaches publication without a named human sign-off recorded in the repo."],
];

export default function Home() {
  const models = loadModels();
  const claims = loadClaims();
  const sources = loadSources();
  const findings = loadFindings();
  const verifiedClaims = claims.filter((c) => c.status === "verified").length;
  const publishedFindings = findings.filter((f) => f.status === "published").length;

  return (
    <div className="space-y-14">
      <section className="space-y-4 pt-4">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
          The true cost of the British state, from first principles.
        </h1>
        <p className="text-ink-2 max-w-2xl">
          An open-source analysis engine that rebuilds what major public services should cost —
          labour, property, physical inputs — obtains what is actually paid, and publishes the
          difference with every step of the workings attached. The headline number is the output
          of the work, never the input.
        </p>
      </section>

      <section
        className="rounded border px-4 py-3 text-sm"
        style={{ borderColor: "var(--unverified)", background: "var(--unverified-bg)", color: "var(--unverified)" }}
      >
        <strong>Status: Phase 0 — nothing is verified yet.</strong>{" "}
        {sources.length} sources identified, {verifiedClaims} of {claims.length} claims verified,{" "}
        {publishedFindings} findings published. Everything currently visible is an illustrative
        seed that the CI constitution refuses to publish. That refusal is the system working.
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            href: "/programme",
            title: "The Programme",
            body: "The costed reform mechanisms — each with its delta, the fix, the instrument, and year-by-year recovery. Empty until the work supports them.",
          },
          {
            href: "/ledger",
            title: "The Ledger",
            body: `The browsable evidence base: ${models.length} cost models, every claim, every source, every assumption a slider.`,
          },
          {
            href: "/feed",
            title: "The Feed",
            body: "Weekly public output: new FOI responses, new deltas, appeals won. The persistence engine.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded border border-hairline bg-surface p-5 space-y-2 hover:border-baseline"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="text-sm text-ink-2">{card.body}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight">Founding principles, encoded in the system</h2>
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {PRINCIPLES.map(([title, body], i) => (
            <div key={title} className="space-y-1">
              <dt className="font-medium text-sm">
                <span className="text-ink-muted tabular-nums mr-2">P{i + 1}</span>
                {title}
              </dt>
              <dd className="text-sm text-ink-2">{body}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
