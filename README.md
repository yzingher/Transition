# Project Ledger

**The true cost of the British state, from first principles. Open source. Every number traceable.**

An analysis engine that (1) rebuilds what major public services *should* cost —
labour, property, physical inputs — (2) obtains what is *actually* paid via
published data and a systematic FOI campaign, (3) publishes the delta,
classified by cause, and (4) distils the result into a costed reform programme.
The headline number is the output of the work, never the input.

Full product requirements: the PRD this repo was built from. Current state:
**Phase 0 scaffold** — the machine exists end to end; nothing is verified yet,
and the machine itself enforces that (see below).

## The constitution, in code

| Principle | Enforcement |
|-----------|-------------|
| P1 — No claim without a chain | [`ci/chain_check.py`](ci/chain_check.py): every model parameter cites a claim, every claim a source; every figure in `/published` carries a `{{value\|ref}}` marker that CI **recomputes with the deterministic engine** and fails on mismatch; `status: published` requires verified claims, hashed sources, and a named reviewer. |
| P4 — Language discipline | [`ci/lexicon_lint.py`](ci/lexicon_lint.py): banned lexicon in the same paragraph as a named entity fails CI. Right-of-reply text (blockquotes) is exempt — it publishes verbatim. |
| P2/P3 — Sliders, conservative bounds | Models are parameterised ranges; the web Ledger recomputes live, only within sourced bounds. P10/P90 are full-correlation scenario bounds — wider than sampled percentiles, deliberately. |
| P6 — AI drafts, humans sign | Publication = merge into `/published`, gated by human review; `reviewed_by` is part of the chain. |

Every seed value in this scaffold is marked `unverified` and every source
`placeholder`, so the chain check makes publication *unreachable* until Phase 0
verification replaces them. Flip a finding to `published` and CI fails with the
exact list of unverified links. That refusal is the system working.

## Layout

```
/models/          YAML cost models — the crown jewels, PR-able by anyone (see models/SCHEMA.md)
/data/            provenance registries: sources, claims, entities (P1's backing store)
/pipelines/       Python: deterministic cost engine, ingestion (Contracts Finder,
                  S251, Companies House), FOI deadline clock — all with offline smokes
/foi/             request templates, agent prompts, precedent library; draft-only until
                  a human flips send_enabled per approved batch
/ci/              the constitution: chain check + lexicon linter (run on every push)
/web/             Next.js — the Programme, the Ledger (sliders), the Feed
/published/       findings; merges here require human review
/decisions/       editorial decision log
/supabase/        Postgres schema mirroring the registries
```

## Getting started

```bash
./bootstrap.sh                                        # pnpm install + uv sync
pnpm dev                                              # web on :3000
uv run --directory pipelines python -m pipelines.smoke  # offline pipeline smoke
uv run --directory pipelines pytest                   # engine + FOI clock tests
pnpm --filter web test                                # TS engine parity vs golden fixture
python3 ci/chain_check.py && python3 ci/lexicon_lint.py  # the constitution
```

The cost engine exists twice — Python (pipelines/CI) and TypeScript (browser
sliders) — pinned to identical output by `models/tests/golden.json`. When a
model changes: `uv run --directory pipelines python scripts/gen_golden.py` and
commit the diff (CI fails on drift).

Secrets: copy `.env.template` to `.env.local`. Nothing in this repo requires
credentials to build, test, or verify — by design.

## Disputing a number

Every parameter of every model cites a claim; every claim cites a source. If
you think a staffing ratio or wage rate is wrong, open a PR against the YAML in
`/models` with a better-sourced claim. Converting attacks into contributions is
the point.
