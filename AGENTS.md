<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Ledger conventions

- **LLMs never compute a published figure.** Models extract, draft, and classify; all arithmetic is deterministic, versioned code (`pipelines/src/pipelines/costmodel/`, `web/src/lib/engine.ts`).
- **No number without a chain.** New model parameters need a claim in `data/claims.json`; new claims need a source in `data/sources.json`. Run `python3 ci/chain_check.py` before committing — it is the merge gate.
- **Never fabricate a value, citation, or ICO precedent.** Seed unverified placeholders explicitly (`status: unverified` / `placeholder`) and let the chain check block publication.
- **Language discipline near named entities** — run `python3 ci/lexicon_lint.py`; "unexplained cost delta", never an accusation.
- When a model or engine changes, regenerate the golden fixture (`uv run --directory pipelines python scripts/gen_golden.py`) and keep both engines passing (`uv run --directory pipelines pytest` + `pnpm --filter web test`).
