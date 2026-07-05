# Data registries

File-based system of record for provenance, mirrored by the Supabase schema in
`/supabase/migrations`. Until the database is live, these JSON files **are** the
registry; the P1 chain check (`/ci/chain_check.py`) runs against them.

## Files

| File | Contents |
|------|----------|
| `sources.json` | Every document we rely on: URL, retrieval date, SHA-256 of the retrieved artefact, type. |
| `claims.json` | Atomic extracted facts: value, unit, period, `source_id`, extraction method, confidence, verification status. |
| `entities.json` | Councils, departments, regulators, providers; Companies House numbers; parent/subsidiary links. |

## Status discipline (P1)

- A **source** is `placeholder` until the actual document has been retrieved and
  hashed; then it becomes `verified` with a real `sha256` and `retrieved_at`.
- A **claim** is `unverified` until a human has checked the value against the
  retrieved source document; then it becomes `verified` with `verified_by`.
- **Nothing published may rest on an unverified claim.** The chain check blocks
  any finding with `status: published` whose chain contains an unverified claim
  or placeholder source. Draft findings may cite unverified claims — that is
  what drafts are for.

All values currently in `claims.json` are **illustrative seeds** for pipeline
development, awaiting Phase 0 verification. They are deliberately marked
`unverified` so the CI constitution prevents their publication.

## Conventions

- IDs are kebab-case, prefixed: `src-`, `clm-`, `ent-`.
- Values are numbers in the stated `unit`; periods are `"2024-25"` fiscal-year
  strings or ISO dates.
- Never edit a verified claim's value: supersede it with a new claim and mark
  the old one `superseded_by`.
