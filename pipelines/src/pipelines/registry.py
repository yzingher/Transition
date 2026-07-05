"""Load the file-based provenance registries in /data.

Until Supabase is live these JSON files are the system of record; the shapes
mirror supabase/migrations/0001_core_schema.sql.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from pipelines import DATA_DIR


@dataclass(frozen=True)
class Source:
    id: str
    type: str
    title: str
    publisher: str | None
    url: str | None
    retrieved_at: str | None
    sha256: str | None
    status: str  # placeholder | verified
    notes: str | None = None


@dataclass(frozen=True)
class Claim:
    id: str
    statement: str
    value: dict[str, float]  # {low, mid, high}
    unit: str
    entity_id: str | None
    period: str
    source_id: str
    method: dict[str, Any]
    confidence: str
    status: str  # unverified | verified
    verified_by: str | None = None
    notes: str | None = None


@dataclass(frozen=True)
class Entity:
    id: str
    name: str
    kind: str
    companies_house_number: str | None
    parent_id: str | None
    aliases: list[str]
    fictional: bool = False
    notes: str | None = None


def _load(name: str, key: str) -> list[dict[str, Any]]:
    with open(DATA_DIR / name, encoding="utf-8") as f:
        payload = json.load(f)
    return payload[key]


def load_sources() -> dict[str, Source]:
    return {row["id"]: Source(**row) for row in _load("sources.json", "sources")}


def load_claims() -> dict[str, Claim]:
    return {row["id"]: Claim(**row) for row in _load("claims.json", "claims")}


def load_entities() -> dict[str, Entity]:
    return {row["id"]: Entity(**row) for row in _load("entities.json", "entities")}
