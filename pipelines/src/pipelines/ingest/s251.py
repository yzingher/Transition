"""DfE Section 251 outturn ingestion.

Does-cost layer: aggregate placement expenditure by council. Where volumes are
published alongside spend, computes the implied unit cost — always flagged
lower-confidence than invoice-level prices (PRD §3.2 graceful degradation).
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

FIXTURE = Path(__file__).resolve().parents[3] / "fixtures" / "s251_sample.csv"

WEEKS_PER_YEAR = 52


@dataclass(frozen=True)
class S251Line:
    la_code: str
    la_name: str
    year: str
    line_code: str
    line_description: str
    net_expenditure_gbp: float
    placement_volume: int | None

    @property
    def implied_weekly_unit_cost(self) -> float | None:
        """Spend / (volume × 52). Lower-confidence than invoice-level prices:
        assumes volumes are full-year-equivalent placements."""
        if not self.placement_volume:
            return None
        return self.net_expenditure_gbp / (self.placement_volume * WEEKS_PER_YEAR)


def parse_file(path: Path | str = FIXTURE) -> list[S251Line]:
    lines: list[S251Line] = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            volume = row.get("placement_volume", "").strip()
            lines.append(
                S251Line(
                    la_code=row["la_code"],
                    la_name=row["la_name"],
                    year=row["year"],
                    line_code=row["line_code"],
                    line_description=row["line_description"],
                    net_expenditure_gbp=float(row["net_expenditure_gbp"]),
                    placement_volume=int(volume) if volume else None,
                )
            )
    return lines


def smoke() -> str:
    lines = parse_file()
    assert lines, "fixture parsed to zero lines"
    residential = next(l for l in lines if l.line_code == "3.2.1")
    unit = residential.implied_weekly_unit_cost
    assert unit is not None and 1000 < unit < 20000, f"implausible implied unit cost {unit}"
    return f"s251: {len(lines)} lines; fixture implied residential unit cost £{unit:,.0f}/week"


if __name__ == "__main__":
    print(smoke())
