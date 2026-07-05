# 0004 — Seed values are unverified by construction

**Date:** 2026-07-05 · **Status:** accepted

Every value seeded into `/data/claims.json` during scaffolding is marked
`unverified`, every source `placeholder`, and the only entity carrying
does-cost fixtures is fictional (Exampleshire County Council). The web UI
badges everything derived from them as illustrative.

Consequence, verified by test: the chain check makes `status: published`
unreachable until Phase 0 replaces seeds with retrieved, hashed, human-verified
sources. The scaffold cannot leak plausible-but-invented numbers into
publication even by accident (the "hallucinated figure ends the project" risk
in PRD §5). No real provider is named anywhere in the seed data — right-of-
reply tooling must exist before real names do (PRD open question 1).
