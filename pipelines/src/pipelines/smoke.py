"""Pipeline smoke test: run every module's offline smoke, evaluate every cost
model, and print the results. Zero network, zero credentials.

    uv run --directory pipelines python -m pipelines.smoke
"""

from __future__ import annotations

import sys

from pipelines.costmodel.engine import evaluate_range, load_all_models
from pipelines.foi import clock
from pipelines.ingest import companies_house, contracts_finder, s251
from pipelines.registry import load_claims, load_entities, load_sources


def main() -> int:
    failures = 0
    for name, fn in [
        ("contracts_finder", contracts_finder.smoke),
        ("s251", s251.smoke),
        ("companies_house", companies_house.smoke),
        ("foi.clock", clock.smoke),
    ]:
        try:
            print(f"  ok  {fn()}")
        except Exception as exc:  # noqa: BLE001 — smoke reports, doesn't crash
            failures += 1
            print(f"FAIL  {name}: {exc}")

    sources, claims, entities = load_sources(), load_claims(), load_entities()
    print(f"  ok  registry: {len(sources)} sources, {len(claims)} claims, {len(entities)} entities")

    for model in load_all_models():
        result = evaluate_range(model)
        print(
            f"  ok  model {model.id} v{model.version} [{model.status}]: "
            f"P10 £{result.p10:,.0f} / P50 £{result.p50:,.0f} / P90 £{result.p90:,.0f} {model.unit}"
        )

    if failures:
        print(f"\n{failures} smoke(s) failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
