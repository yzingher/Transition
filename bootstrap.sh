#!/usr/bin/env bash
set -euo pipefail

command -v pnpm >/dev/null || npm i -g pnpm
command -v uv >/dev/null || curl -LsSf https://astral.sh/uv/install.sh | sh

pnpm install                          # web workspace
uv sync --directory pipelines         # Python workers

cp -n .env.template .env.local 2>/dev/null || true
echo ">> Fill .env.local (optional — nothing needs credentials to build/test), then:"
echo ">> pnpm dev                                              # web on :3000"
echo ">> uv run --directory pipelines python -m pipelines.smoke  # pipeline smoke test"
echo ">> uv run --directory pipelines pytest                   # tests"
echo ">> python3 ci/chain_check.py && python3 ci/lexicon_lint.py  # the constitution"
