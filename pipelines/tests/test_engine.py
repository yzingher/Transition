import json

import pytest

from pipelines import MODELS_DIR
from pipelines.costmodel.engine import ModelError, evaluate_range, load_all_models, load_model

GOLDEN = MODELS_DIR / "tests" / "golden.json"


def test_all_models_load_and_evaluate():
    models = load_all_models()
    assert models, "no models found"
    for model in models:
        result = evaluate_range(model)
        assert 0 < result.p10 <= result.p50 <= result.p90


def test_occupancy_direction_is_inverted():
    """Low occupancy must RAISE per-child cost — the direction detector's whole job."""
    model = load_model(MODELS_DIR / "residential-childrens-home-4bed.yaml")
    result = evaluate_range(model)
    assert result.directions["occupancy"] == -1
    assert result.directions["rcw_hourly_wage"] == 1


def test_golden_parity():
    """Both engines (Python here, TypeScript in web/src/lib/engine.test.ts) must
    reproduce these exact figures. Regenerate deliberately with
    scripts/gen_golden.py when a model changes."""
    golden = json.loads(GOLDEN.read_text())
    for entry in golden["models"]:
        model = load_model(MODELS_DIR / f"{entry['id']}.yaml")
        assert model.version == entry["version"], f"{entry['id']}: version drift — regenerate golden"
        result = evaluate_range(model)
        for key in ("p10", "p50", "p90"):
            assert getattr(result, key) == pytest.approx(entry[key], abs=1e-6), f"{entry['id']}.{key}"
        for comp_key, comp_val in entry["central_components"].items():
            assert result.central_values[comp_key] == pytest.approx(comp_val, abs=1e-6)


def test_rejects_unchained_parameter(tmp_path):
    bad = tmp_path / "bad-model.yaml"
    bad.write_text(
        """
id: bad-model
version: 0.0.1
title: Bad
sector: test
unit: GBP
status: draft
description: no claims cited
parameters:
  - key: x
    label: X
    unit: GBP
    range: { low: 1, mid: 2, high: 3 }
    claims: []
components: []
outputs:
  - key: out
    label: Out
    formula: x
primary_output: out
"""
    )
    with pytest.raises(ModelError, match="P1"):
        load_model(bad)
