"""Contracts Finder / Find a Tender ingestion (OCDS).

Layer-1 published data: every central contract >£12k, local >£30k. Offline by
default — parses the synthetic fixture; pass live=True (and set
CONTRACTS_FINDER_BASE) to hit the real OCDS search API.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import httpx

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "contracts_finder_sample.json"


@dataclass(frozen=True)
class AwardRecord:
    ocid: str
    buyer: str
    title: str
    cpv: str
    supplier: str
    amount_gbp: float
    start: str | None
    end: str | None


def parse_release_package(package: dict) -> list[AwardRecord]:
    records: list[AwardRecord] = []
    for release in package.get("releases", []):
        buyer = (release.get("buyer") or {}).get("name", "")
        tender = release.get("tender") or {}
        title = tender.get("title", "")
        cpv = (tender.get("classification") or {}).get("id", "")
        for award in release.get("awards", []):
            value = award.get("value") or {}
            if value.get("currency") not in (None, "GBP"):
                continue
            period = award.get("contractPeriod") or {}
            for supplier in award.get("suppliers", [{}]):
                records.append(
                    AwardRecord(
                        ocid=release.get("ocid", ""),
                        buyer=buyer,
                        title=title,
                        cpv=cpv,
                        supplier=supplier.get("name", ""),
                        amount_gbp=float(value.get("amount") or 0),
                        start=period.get("startDate"),
                        end=period.get("endDate"),
                    )
                )
    return records


def fetch_awards(query: str = "", live: bool = False) -> list[AwardRecord]:
    if not live:
        with open(FIXTURE, encoding="utf-8") as f:
            return parse_release_package(json.load(f))
    base = os.environ["CONTRACTS_FINDER_BASE"]
    resp = httpx.get(
        f"{base}/rest/searches/Search",
        params={"keyword": query, "stages": "award"},
        timeout=30,
    )
    resp.raise_for_status()
    return parse_release_package(resp.json())


def smoke() -> str:
    records = fetch_awards()
    assert records, "fixture parsed to zero awards"
    assert all(r.amount_gbp > 0 for r in records)
    return f"contracts_finder: parsed {len(records)} awards from fixture"


if __name__ == "__main__":
    print(smoke())
