# Cost model format

Every should-cost model is a single YAML file in this directory. Models are
**declarative**: parameters with sourced ranges, plus deterministic arithmetic.
No model may contain a number that does not cite a claim. Anyone who disputes a
ratio submits a PR against the YAML — that is the point.

## Top-level fields

```yaml
id: residential-childrens-home-4bed   # kebab-case, matches filename
version: 0.1.0                        # semver; bump on any change
title: Residential children's home, 4-bed, standard needs
sector: childrens-social-care
unit: GBP/child-week                  # unit of the primary output
status: draft                         # draft | review | published
description: >
  One paragraph: what is being costed, and the boundary of the model.
parameters: [...]
components: [...]
outputs: [...]
primary_output: per_child_week
```

## `parameters`

Each parameter is a sourced range — these become the sliders (P2).

```yaml
- key: rcw_hourly_wage          # identifier used in formulas
  label: Residential care worker hourly wage
  unit: GBP/hour
  range: { low: 12.0, mid: 13.5, high: 15.5 }
  claims: [clm-rcw-hourly-wage] # ≥1 claim id from /data/claims.json — REQUIRED
  notes: optional caveats
```

Rules enforced by `/ci/chain_check.py`:

- every parameter cites at least one existing claim;
- the parameter's range must lie within the cited claims' ranges (a model may
  narrow a sourced range, never widen it);
- `low ≤ mid ≤ high`.

## `components` and `outputs`

Deterministic formulas over parameter keys and previously defined component
keys. The expression language is intentionally tiny: numbers, identifiers,
`+ - * /`, and parentheses. No functions, no conditionals. If a model needs
more, that is a signal the model should be decomposed, not the language grown.

```yaml
components:
  - key: rcw_cost
    label: Care worker wage bill (weekly, whole home)
    formula: rcw_fte * rcw_weekly_hours * rcw_hourly_wage * wage_oncost

outputs:
  - key: weekly_total
    label: Weekly operating cost, whole home
    formula: rcw_cost + management_cost + property_cost   # etc.
  - key: per_child_week
    label: Should-cost per child-week
    formula: weekly_total / (places * occupancy)
```

## How the range is computed

The engine (identical implementations: `pipelines/src/pipelines/costmodel/engine.py`
and `web/src/lib/engine.ts`, kept in lock-step by the shared golden fixture in
`models/tests/golden.json`) evaluates:

- **central** (reported as P50): every parameter at `mid`;
- **low bound** (reported as P10): each parameter at whichever of its bounds
  *decreases* the primary output (direction detected numerically — e.g. low
  occupancy *raises* per-child cost, so the low bound uses `occupancy.high`);
- **high bound** (P90): the mirror image.

This is a full-correlation scenario bound, not a true percentile — it is wider
than a Monte Carlo P10–P90 would be, which is the conservative direction (P3).
The method is stated wherever the numbers are shown. Models are assumed
monotone in each parameter; the engine verifies this assumption numerically
and refuses to evaluate a model that violates it.
