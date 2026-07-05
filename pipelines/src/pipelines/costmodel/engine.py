"""Deterministic should-cost engine.

Evaluates a declarative cost model (models/*.yaml) into a P10/P50/P90 range for
its primary output, plus a component breakdown at the central scenario.

Method (documented in models/SCHEMA.md and shown wherever numbers appear):
- P50: every parameter at `mid`.
- P10/P90: full-correlation scenario bounds. For each parameter the engine
  detects numerically which bound decreases/increases the primary output
  (e.g. low occupancy RAISES per-child cost) and composes the min/max vectors.
  This is wider than a Monte Carlo percentile — conservative by construction.

The engine assumes models are monotone in each parameter and verifies that the
resulting bounds bracket the central value, refusing to evaluate otherwise.

Mirrored by web/src/lib/engine.ts; both pinned by models/tests/golden.json.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

from pipelines import MODELS_DIR
from pipelines.costmodel.expr import FormulaError, evaluate, referenced_names


class ModelError(ValueError):
    pass


@dataclass(frozen=True)
class Parameter:
    key: str
    label: str
    unit: str
    low: float
    mid: float
    high: float
    claims: list[str]
    notes: str | None = None


@dataclass(frozen=True)
class Formula:
    key: str
    label: str
    formula: str


@dataclass(frozen=True)
class CostModel:
    id: str
    version: str
    title: str
    sector: str
    unit: str
    status: str
    description: str
    parameters: list[Parameter]
    components: list[Formula]
    outputs: list[Formula]
    primary_output: str
    path: str | None = None

    def parameter(self, key: str) -> Parameter:
        for p in self.parameters:
            if p.key == key:
                return p
        raise KeyError(key)


@dataclass(frozen=True)
class RangeResult:
    p10: float
    p50: float
    p90: float
    # direction of the primary output in each parameter: +1 increasing, -1 decreasing, 0 flat
    directions: dict[str, int]
    # all component/output values at the central scenario
    central_values: dict[str, float] = field(default_factory=dict)


def load_model(path: str | Path) -> CostModel:
    path = Path(path)
    with open(path, encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    try:
        parameters = [
            Parameter(
                key=p["key"],
                label=p["label"],
                unit=p["unit"],
                low=float(p["range"]["low"]),
                mid=float(p["range"]["mid"]),
                high=float(p["range"]["high"]),
                claims=list(p["claims"]),
                notes=p.get("notes"),
            )
            for p in raw["parameters"]
        ]
        components = [Formula(c["key"], c["label"], c["formula"]) for c in raw["components"]]
        outputs = [Formula(o["key"], o["label"], o["formula"]) for o in raw["outputs"]]
        model = CostModel(
            id=raw["id"],
            version=raw["version"],
            title=raw["title"],
            sector=raw["sector"],
            unit=raw["unit"],
            status=raw["status"],
            description=raw["description"],
            parameters=parameters,
            components=components,
            outputs=outputs,
            primary_output=raw["primary_output"],
            path=str(path),
        )
    except (KeyError, TypeError) as exc:
        raise ModelError(f"{path}: malformed model: {exc}") from exc
    _validate(model)
    return model


def load_all_models(models_dir: Path | None = None) -> list[CostModel]:
    models_dir = models_dir or MODELS_DIR
    return [load_model(p) for p in sorted(models_dir.glob("*.yaml"))]


def _validate(model: CostModel) -> None:
    if model.id != Path(model.path or "").stem:
        raise ModelError(f"{model.id}: id must match filename")
    seen: set[str] = set()
    for p in model.parameters:
        if p.key in seen:
            raise ModelError(f"{model.id}: duplicate key {p.key!r}")
        seen.add(p.key)
        if not (p.low <= p.mid <= p.high):
            raise ModelError(f"{model.id}.{p.key}: range must satisfy low <= mid <= high")
        if not p.claims:
            raise ModelError(f"{model.id}.{p.key}: every parameter must cite at least one claim (P1)")
    for f in [*model.components, *model.outputs]:
        if f.key in seen:
            raise ModelError(f"{model.id}: duplicate key {f.key!r}")
        refs = referenced_names(f.formula)
        unknown = refs - seen
        if unknown:
            raise ModelError(
                f"{model.id}.{f.key}: references undefined names {sorted(unknown)} "
                "(formulas may only use parameters and previously defined keys)"
            )
        seen.add(f.key)
    if model.primary_output not in {o.key for o in model.outputs}:
        raise ModelError(f"{model.id}: primary_output {model.primary_output!r} is not an output")


def evaluate_scenario(model: CostModel, values: dict[str, float]) -> dict[str, float]:
    """Evaluate all components and outputs for one full parameter assignment."""
    names = dict(values)
    for f in [*model.components, *model.outputs]:
        try:
            names[f.key] = evaluate(f.formula, names)
        except FormulaError as exc:
            raise ModelError(f"{model.id}.{f.key}: {exc}") from exc
    return names


def evaluate_range(model: CostModel) -> RangeResult:
    mid = {p.key: p.mid for p in model.parameters}
    central = evaluate_scenario(model, mid)
    p50 = central[model.primary_output]

    directions: dict[str, int] = {}
    for p in model.parameters:
        lo_val = evaluate_scenario(model, {**mid, p.key: p.low})[model.primary_output]
        hi_val = evaluate_scenario(model, {**mid, p.key: p.high})[model.primary_output]
        directions[p.key] = 0 if hi_val == lo_val else (1 if hi_val > lo_val else -1)

    min_vec = {p.key: (p.low if directions[p.key] >= 0 else p.high) for p in model.parameters}
    max_vec = {p.key: (p.high if directions[p.key] >= 0 else p.low) for p in model.parameters}
    p10 = evaluate_scenario(model, min_vec)[model.primary_output]
    p90 = evaluate_scenario(model, max_vec)[model.primary_output]

    if not (p10 <= p50 <= p90):
        raise ModelError(
            f"{model.id}: bound composition failed (p10={p10}, p50={p50}, p90={p90}); "
            "model is not monotone in its parameters"
        )
    return RangeResult(p10=p10, p50=p50, p90=p90, directions=directions, central_values=central)
