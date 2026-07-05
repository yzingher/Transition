# 0003 — Full-correlation scenario bounds, labelled honestly

**Date:** 2026-07-05 · **Status:** accepted

The engine's P10/P90 are not Monte Carlo percentiles: they are scenario bounds
with every parameter simultaneously at its cost-minimising (or -maximising)
bound, with per-parameter direction detected numerically (low occupancy raises
per-child cost, so the low-cost bound uses high occupancy).

This is wider than a sampled P10–P90 — the conservative direction under P3,
because published deltas are computed against the *generous* end of the
should-cost range ("delta survives even at the most generous assumptions").
The method is stated in `models/SCHEMA.md` and wherever numbers are shown.
Revisit if/when hostile audit prefers a sampled distribution; that requires a
seeded, versioned sampler to stay deterministic (P1).
