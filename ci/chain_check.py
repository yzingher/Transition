#!/usr/bin/env python3
"""P1 — No claim without a chain. The project's constitution, in code.

Verifies, across the whole repo:

1. Registry integrity: every claim cites an existing source; entities resolve.
2. Model chains: every model parameter cites existing claims; a parameter's
   range may narrow a sourced range, never widen it.
3. Published findings (/published/**/*.md):
   - every money/percent figure in the body is wrapped in a chain marker
     {{<displayed>|<ref>}} where <ref> is either a claim id (clm-…[:low|mid|high])
     or a calc ref calc:<model-id>@<version>/<output>/<p10|p50|p90>;
   - every marker RESOLVES: the claim exists, or the calc recomputes — this
     script re-runs the deterministic engine and requires the displayed number
     to equal the recomputed value at the displayed precision;
   - a finding with status: published must rest exclusively on verified claims
     and verified sources (sha256 + retrieved_at present), carry reviewed_by,
     and — if it names any non-fictional entity — a right-of-reply section.

Exit non-zero on any violation. Dependencies: stdlib + PyYAML only.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "pipelines" / "src"))

from pipelines.costmodel.engine import evaluate_range, load_all_models  # noqa: E402

ERRORS: list[str] = []
WARNINGS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def load_registries():
    sources = {s["id"]: s for s in json.loads((REPO / "data/sources.json").read_text())["sources"]}
    claims = {c["id"]: c for c in json.loads((REPO / "data/claims.json").read_text())["claims"]}
    entities = {e["id"]: e for e in json.loads((REPO / "data/entities.json").read_text())["entities"]}
    return sources, claims, entities


def check_registries(sources, claims, entities) -> None:
    for c in claims.values():
        if c["source_id"] not in sources:
            err(f"claim {c['id']}: unknown source {c['source_id']}")
        if c.get("entity_id") and c["entity_id"] not in entities:
            err(f"claim {c['id']}: unknown entity {c['entity_id']}")
        v = c["value"]
        if not (v["low"] <= v["mid"] <= v["high"]):
            err(f"claim {c['id']}: value range must satisfy low <= mid <= high")
        if c["status"] == "verified":
            src = sources.get(c["source_id"], {})
            if src.get("status") != "verified":
                err(f"claim {c['id']}: verified claim cites non-verified source {c['source_id']}")
            if not c.get("verified_by"):
                err(f"claim {c['id']}: verified claim missing verified_by")
    for s in sources.values():
        if s["status"] == "verified" and not (s.get("sha256") and s.get("retrieved_at")):
            err(f"source {s['id']}: verified source must carry sha256 and retrieved_at")
    for e in entities.values():
        if e.get("parent_id") and e["parent_id"] not in entities:
            err(f"entity {e['id']}: unknown parent {e['parent_id']}")


def check_models(models, claims) -> dict[str, dict]:
    """Validate model→claim chains; return computed ranges keyed by model id."""
    computed: dict[str, dict] = {}
    for model in models:
        for p in model.parameters:
            for claim_id in p.claims:
                claim = claims.get(claim_id)
                if claim is None:
                    err(f"model {model.id}.{p.key}: unknown claim {claim_id}")
                    continue
            primary = claims.get(p.claims[0])
            if primary and primary["unit"] != p.unit:
                warn(f"model {model.id}.{p.key}: unit {p.unit!r} differs from claim unit {primary['unit']!r}")
            if primary:
                cv = primary["value"]
                if p.low < cv["low"] or p.high > cv["high"]:
                    err(
                        f"model {model.id}.{p.key}: range [{p.low}, {p.high}] widens sourced "
                        f"range [{cv['low']}, {cv['high']}] of {p.claims[0]} (may only narrow)"
                    )
        result = evaluate_range(model)
        computed[model.id] = {
            "version": model.version,
            "outputs": {
                "p10": {model.primary_output: result.p10},
                "p50": dict(result.central_values),
                "p90": {model.primary_output: result.p90},
            },
        }
    return computed


FRONT_MATTER_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
MARKER_RE = re.compile(r"\{\{([^|{}]+)\|([^|{}]+)\}\}")
NAKED_MONEY_RE = re.compile(r"£\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:bn|billion|m|million|k))?")
NAKED_PCT_RE = re.compile(r"\b\d+(?:\.\d+)?%")
CALC_REF_RE = re.compile(r"calc:([\w-]+)@([\w.]+)/([\w-]+)/(p10|p50|p90)")


def parse_displayed_number(text: str) -> tuple[float, int] | None:
    m = re.search(r"(\d[\d,]*(?:\.\d+)?)", text)
    if not m:
        return None
    raw = m.group(1).replace(",", "")
    decimals = len(raw.split(".")[1]) if "." in raw else 0
    value = float(raw)
    lowered = text.lower()
    if "bn" in lowered or "billion" in lowered:
        value *= 1e9
    elif re.search(r"\d\s?(m\b|million)", lowered):
        value *= 1e6
    return value, decimals


def check_finding(path: Path, sources, claims, entities, computed) -> None:
    rel = path.relative_to(REPO)
    text = path.read_text(encoding="utf-8")
    fm_match = FRONT_MATTER_RE.match(text)
    if not fm_match:
        err(f"{rel}: missing YAML front matter")
        return
    fm = yaml.safe_load(fm_match.group(1))
    body = text[fm_match.end():]
    status = fm.get("status")
    if status not in ("draft", "review", "published"):
        err(f"{rel}: status must be draft|review|published, got {status!r}")
        return

    used_claims: set[str] = set()

    # 1. Every chain marker must resolve.
    for m in MARKER_RE.finditer(body):
        displayed, ref = m.group(1).strip(), m.group(2).strip()
        parsed = parse_displayed_number(displayed)
        calc = CALC_REF_RE.fullmatch(ref)
        if calc:
            model_id, version, output, scenario = calc.groups()
            comp = computed.get(model_id)
            if comp is None:
                err(f"{rel}: marker references unknown model {model_id}")
                continue
            if comp["version"] != version:
                err(f"{rel}: marker pins {model_id}@{version} but repo has @{comp['version']}")
                continue
            value = comp["outputs"][scenario].get(output)
            if value is None:
                err(f"{rel}: {model_id} has no output {output!r} under {scenario}")
                continue
            if parsed is None:
                err(f"{rel}: marker {m.group(0)!r} displays no parseable number")
                continue
            shown, decimals = parsed
            if round(value, decimals) != shown:
                err(
                    f"{rel}: displayed {displayed!r} != recomputed {output} {scenario} "
                    f"of {model_id} = {value:.4f} (rounds to {round(value, decimals)})"
                )
        else:
            claim_id, _, bound = ref.partition(":")
            claim = claims.get(claim_id)
            if claim is None:
                err(f"{rel}: marker references unknown ref {ref!r} (not a claim, not a calc)")
                continue
            used_claims.add(claim_id)
            if parsed is not None:
                shown, decimals = parsed
                value = claim["value"][bound or "mid"]
                if round(float(value), decimals) != shown:
                    err(f"{rel}: displayed {displayed!r} != claim {claim_id} {bound or 'mid'} = {value}")

    # 2. No naked money/percent figures outside markers.
    stripped = MARKER_RE.sub(" ", body)
    stripped = re.sub(r"`[^`]*`", " ", stripped)
    for pattern in (NAKED_MONEY_RE, NAKED_PCT_RE):
        for m in pattern.finditer(stripped):
            err(f"{rel}: naked figure {m.group(0)!r} — every figure needs a {{{{value|ref}}}} chain marker")

    # 3. Declared claim list must cover markers.
    declared = set(fm.get("claims", []) or [])
    undeclared = used_claims - declared
    if undeclared:
        err(f"{rel}: claims used in body but not declared in front matter: {sorted(undeclared)}")

    # 4. Publication gate.
    if status == "published":
        if not fm.get("reviewed_by"):
            err(f"{rel}: published finding requires reviewed_by (P6 — AI drafts, humans sign)")
        for claim_id in declared | used_claims:
            claim = claims.get(claim_id)
            if claim is None:
                err(f"{rel}: declared claim {claim_id} does not exist")
                continue
            if claim["status"] != "verified":
                err(f"{rel}: published finding rests on unverified claim {claim_id}")
            src = sources.get(claim["source_id"], {})
            if src.get("status") != "verified":
                err(f"{rel}: published finding rests on placeholder source {claim.get('source_id')}")
        named = [
            e for e in entities.values()
            if not e.get("fictional") and re.search(re.escape(e["name"]), body)
            and e["kind"] in ("provider", "council")
        ]
        if named and not fm.get("right_of_reply"):
            err(
                f"{rel}: names {[e['name'] for e in named]} but has no right_of_reply record "
                "(P4 — 14-day pre-publication window, response published verbatim)"
            )


def main() -> int:
    sources, claims, entities = load_registries()
    check_registries(sources, claims, entities)
    models = load_all_models()
    computed = check_models(models, claims)

    findings = sorted((REPO / "published").rglob("*.md"))
    for path in findings:
        if path.name == "README.md":
            continue
        check_finding(path, sources, claims, entities, computed)

    for w in WARNINGS:
        print(f"warn: {w}")
    if ERRORS:
        for e in ERRORS:
            print(f"CHAIN VIOLATION: {e}")
        print(f"\n{len(ERRORS)} chain violation(s). Nothing publishes without a complete chain (P1).")
        return 1
    print(
        f"chain check ok: {len(claims)} claims / {len(sources)} sources / "
        f"{len(models)} models / {len([f for f in findings if f.name != 'README.md'])} findings"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
