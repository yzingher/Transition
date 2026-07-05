import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ModelExplorer, type DoesCostFixture, type ParamProvenance } from "@/components/ModelExplorer";
import { loadClaims, loadModel, loadModels, loadSources } from "@/lib/data";

export function generateStaticParams() {
  return loadModels().map((m) => ({ id: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const model = loadModel(id);
  return { title: model ? model.title : "Model not found" };
}

// Synthetic does-cost fixtures keyed by model — replaced by real ingested
// claims (per buyer) when Layer-1 ingestion goes live. Fictional council only.
const DOES_COST_FIXTURES: Record<string, string> = {
  "residential-childrens-home-4bed": "clm-exampleshire-residential-avg-weekly",
  "fostering-ifa-standard": "clm-exampleshire-ifa-avg-weekly",
};

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = loadModel(id);
  if (!model) notFound();

  const claims = new Map(loadClaims().map((c) => [c.id, c]));
  const sources = new Map(loadSources().map((s) => [s.id, s]));

  const provenance: Record<string, ParamProvenance[]> = {};
  for (const p of model.parameters) {
    provenance[p.key] = p.claims.flatMap((claimId) => {
      const claim = claims.get(claimId);
      if (!claim) return [];
      const source = sources.get(claim.source_id);
      return [
        {
          claimId,
          statement: claim.statement,
          sourceTitle: source?.title ?? claim.source_id,
          sourceUrl: source?.url ?? null,
          claimStatus: claim.status,
        },
      ];
    });
  }

  let doesCost: DoesCostFixture | null = null;
  const fixtureClaim = claims.get(DOES_COST_FIXTURES[model.id] ?? "");
  if (fixtureClaim) {
    doesCost = {
      value: fixtureClaim.value.mid,
      label: "price paid (synthetic fixture, fictional council)",
      claimId: fixtureClaim.id,
    };
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs text-ink-muted">
          <Link href="/ledger" className="underline underline-offset-2">The Ledger</Link>
          {" / "}cost models{" / "}
          <span className="tabular-nums">{model.id} v{model.version}</span>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{model.title}</h1>
        <p className="text-sm text-ink-2 max-w-2xl">{model.description}</p>
        <p className="text-xs text-ink-muted">
          Model status: {model.status} · every parameter below cites a claim in the public
          registry · dispute a number by pull request against{" "}
          <code className="text-[11px]">models/{model.id}.yaml</code>
        </p>
      </header>
      <ModelExplorer model={model} provenance={provenance} doesCost={doesCost} />
    </div>
  );
}
