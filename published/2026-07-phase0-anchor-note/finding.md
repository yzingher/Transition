---
id: phase0-anchor-note
title: "Phase 0: pinning the anchor — what does the £400k figure actually measure?"
status: draft
models:
  - residential-childrens-home-4bed@0.1.0
  - fostering-ifa-standard@0.1.0
claims:
  - clm-anchor-400k-headline
  - clm-exampleshire-residential-avg-weekly
reviewed_by: null
right_of_reply: null
---

## Why this note exists

Before anything is built on it, the project's flagship statistic must survive
the project's own standard. The figure of {{£400,000|clm-anchor-400k-headline}}
per year for a residential children's placement circulates widely. If it is a
high-acuity outlier presented as an average, this project inherits the exact
credibility problem it exists to solve. This note is the P1–P6 pipeline's dry
run: it will not leave draft status until every cell below is verified.

## What must be pinned

1. **Scope** — residential only, or all placement types blended?
2. **Statistic** — mean, median, or a quoted worst case?
3. **Boundary** — placement fee only, or including local-authority social work
   and commissioning overhead?
4. **Vintage and source** — which primary document, which year, retrieved and
   hashed.

The candidate primary sources are logged as `src-anchor-400k-provenance` in
the source registry, deliberately still a placeholder: nothing here is
verified yet, and the chain check will therefore refuse to let this note
publish. That refusal is the system working.

## What our own engine says so far

For calibration only — every parameter is an unverified seed (see
`/data/claims.json`), so these are illustrations of the method, not findings.
The bottom-up should-cost of a standard-needs 4-bed residential place
currently evaluates to
{{£3,857|calc:residential-childrens-home-4bed@0.1.0/per_child_week/p50}} per
child-week central, with full-correlation scenario bounds of
{{£2,488|calc:residential-childrens-home-4bed@0.1.0/per_child_week/p10}} to
{{£6,314|calc:residential-childrens-home-4bed@0.1.0/per_child_week/p90}}.
An IFA fostering place evaluates to
{{£774|calc:fostering-ifa-standard@0.1.0/per_child_week/p50}} per child-week
central. Our synthetic test fixture prices a residential placement at
{{£5,800|clm-exampleshire-residential-avg-weekly}} per week for a fictional
council — the shape of delta the real data will be interrogated for.

## Exit criteria for this note

- [ ] Primary document(s) behind the anchor figure identified, retrieved,
      SHA-256 hashed, and registered as verified sources.
- [ ] The figure's scope, statistic, and boundary stated exactly, with a
      verified claim per fact.
- [ ] Model parameters re-grounded in retrieved documents where the anchor
      work surfaced better sources.
- [ ] Human reviewer signs (`reviewed_by`), status moves to `review`, then
      `published` — at which point the chain check enforces all of the above
      mechanically.
