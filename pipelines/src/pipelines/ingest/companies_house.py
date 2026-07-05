"""Companies House ingestion: resolve providers to companies, walk ownership
chains, and (later) pull filed accounts for margin/debt structure.

Offline by default via fixture; live mode needs COMPANIES_HOUSE_API_KEY.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import httpx

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "companies_house_profile.json"
API_BASE = "https://api.company-information.service.gov.uk"


@dataclass(frozen=True)
class CompanyProfile:
    company_number: str
    name: str
    status: str
    sic_codes: list[str]
    incorporated: str | None


def parse_profile(payload: dict) -> CompanyProfile:
    return CompanyProfile(
        company_number=payload["company_number"],
        name=payload["company_name"],
        status=payload.get("company_status", "unknown"),
        sic_codes=list(payload.get("sic_codes", [])),
        incorporated=payload.get("date_of_creation"),
    )


def fetch_profile(company_number: str, live: bool = False) -> CompanyProfile:
    if not live:
        with open(FIXTURE, encoding="utf-8") as f:
            return parse_profile(json.load(f))
    key = os.environ["COMPANIES_HOUSE_API_KEY"]
    resp = httpx.get(f"{API_BASE}/company/{company_number}", auth=(key, ""), timeout=30)
    resp.raise_for_status()
    return parse_profile(resp.json())


def smoke() -> str:
    profile = fetch_profile("00000000")
    assert profile.company_number and profile.name
    return f"companies_house: parsed fixture profile {profile.name} ({profile.company_number})"


if __name__ == "__main__":
    print(smoke())
