import type { Metadata } from "next";

export const metadata: Metadata = { title: "The Programme" };

const PHASES = [
  {
    name: "Phase 0 — anchor verification",
    state: "in progress",
    body: "Pin the flagship figure from primary sources before anything is built on it: what it measures, from which documents. Output: one published note, fully chained — the P1–P6 pipeline's first dry run.",
  },
  {
    name: "Phase 1 — one sector, end to end",
    state: "not started",
    body: "Children's social care placements: should-cost models, S251 and council spend ingestion, FOI wave 1 (~150 councils, banded costs), first classified sector delta. Exit criterion: the finding survives two weeks of public contact with hostile economists and provider lawyers without a correction.",
  },
  {
    name: "Phase 2 — replicate",
    state: "not started",
    body: "Asylum accommodation, SEND transport, NHS agency staffing, central government consultancy, temporary accommodation — one sector per ~6 weeks once the pipeline is proven.",
  },
  {
    name: "Phase 3 — the Programme",
    state: "not started",
    body: "Assemble the mechanisms whose deltas survived audit into the costed programme with the honest headline number, weighted toward fixes needing no primary legislation.",
  },
];

export default function ProgrammePage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">The Programme</h1>
        <p className="text-ink-2 max-w-2xl">
          The headline artefact: specific reform mechanisms, each with a savings figure, a recovery
          timeline, the exact rule change required, who loses money, and their predicted
          counter-arguments answered in advance.
        </p>
      </header>

      <section className="rounded border border-hairline bg-surface p-6 space-y-2">
        <h2 className="font-semibold">No mechanisms yet — deliberately.</h2>
        <p className="text-sm text-ink-2 max-w-2xl">
          A mechanism enters the Programme only when its delta has survived audit: verified sources,
          a should-cost model that held up to public challenge, a classified cause, and a named
          human sign-off. Publishing the machinery before the findings is the point — you can watch
          the evidence assemble in the Ledger and hold us to the standard we set.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Where the work stands</h2>
        <ol className="space-y-4">
          {PHASES.map((phase) => (
            <li key={phase.name} className="rounded border border-hairline bg-surface p-5 space-y-1">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-medium text-sm">{phase.name}</h3>
                <span className="text-xs text-ink-muted uppercase tracking-wide">{phase.state}</span>
              </div>
              <p className="text-sm text-ink-2">{phase.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
