"""FOI deadline clock.

FOIA s10: a public authority must respond promptly and in any event within 20
working days following the date of receipt. Internal reviews: 20 working days
by ICO guidance (up to 40 in exceptional cases). The persistent worker uses
this module to escalate automatically when clocks expire.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

from pipelines import REPO_ROOT

HOLIDAYS_FILE = REPO_ROOT / "foi" / "bank-holidays-england.json"
RESPONSE_WORKING_DAYS = 20


def load_holidays(path: Path | str = HOLIDAYS_FILE) -> set[date]:
    with open(path, encoding="utf-8") as f:
        payload = json.load(f)
    return {date.fromisoformat(d) for d in payload["england-and-wales"]}


def is_working_day(d: date, holidays: set[date]) -> bool:
    return d.weekday() < 5 and d not in holidays


def add_working_days(start: date, n: int, holidays: set[date]) -> date:
    """N working days *following* start (FOIA counts from the day after receipt)."""
    d = start
    remaining = n
    while remaining > 0:
        d += timedelta(days=1)
        if is_working_day(d, holidays):
            remaining -= 1
    return d


@dataclass(frozen=True)
class ClockStatus:
    due: date
    working_days_remaining: int
    overdue: bool


def response_due(received: date, holidays: set[date] | None = None) -> date:
    holidays = holidays if holidays is not None else load_holidays()
    return add_working_days(received, RESPONSE_WORKING_DAYS, holidays)


def clock_status(received: date, today: date, holidays: set[date] | None = None) -> ClockStatus:
    holidays = holidays if holidays is not None else load_holidays()
    due = response_due(received, holidays)
    if today > due:
        return ClockStatus(due=due, working_days_remaining=0, overdue=True)
    remaining = 0
    d = today
    while d < due:
        d += timedelta(days=1)
        if is_working_day(d, holidays):
            remaining += 1
    return ClockStatus(due=due, working_days_remaining=remaining, overdue=False)


def smoke() -> str:
    holidays = load_holidays()
    # Request received Wed 2026-04-01: Good Friday (04-03) and Easter Monday
    # (04-06) must not count, pushing the 20th working day to Fri 2026-05-01.
    due = response_due(date(2026, 4, 1), holidays)
    assert due == date(2026, 5, 1), f"expected 2026-05-01, got {due}"
    status = clock_status(date(2026, 4, 1), date(2026, 4, 20), holidays)
    assert not status.overdue and status.working_days_remaining == 9
    return f"foi.clock: request received 2026-04-01 is due {due} (holidays handled)"


if __name__ == "__main__":
    print(smoke())
