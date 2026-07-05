"""Project Ledger pipelines: ingestion, cost-model engine, FOI tooling.

LLM usage pattern (PRD constraint): models extract, draft, and classify.
Models never compute a published figure — all arithmetic in this package is
deterministic, versioned code operating on structured claims.
"""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = REPO_ROOT / "data"
MODELS_DIR = REPO_ROOT / "models"
