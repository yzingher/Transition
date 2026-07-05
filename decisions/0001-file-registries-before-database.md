# 0001 — File registries before database

**Date:** 2026-07-05 · **Status:** accepted

The provenance registries (sources, claims, entities) start as JSON files in
`/data`, with the Supabase schema (`supabase/migrations/0001_core_schema.sql`)
mirroring their shapes for when ingestion volume demands a database.

Reasons: the CI constitution must run on every PR with nothing but a checkout —
no credentials, no network; reviewers must be able to see a claim change in a
diff; and P5 (everything public) is trivially true of files in the repo.
The database becomes the system of record when Layer-1 ingestion goes live;
the file registries then become seed/export artifacts. The chain-check rules
do not change, only their backing store.
