from datetime import date

from pipelines.foi.clock import add_working_days, clock_status, load_holidays, response_due


def test_due_date_skips_easter_2026():
    holidays = load_holidays()
    assert response_due(date(2026, 4, 1), holidays) == date(2026, 5, 1)


def test_plain_weeks():
    # No holidays in range: 20 working days from a Monday = four weeks later, Monday
    assert add_working_days(date(2026, 6, 1), 20, set()) == date(2026, 6, 29)


def test_weekend_received():
    # Received Saturday: clock starts from the next working day
    assert add_working_days(date(2026, 6, 6), 1, set()) == date(2026, 6, 8)


def test_overdue():
    status = clock_status(date(2026, 4, 1), date(2026, 5, 2), load_holidays())
    assert status.overdue and status.working_days_remaining == 0


def test_remaining_counts_working_days_only():
    status = clock_status(date(2026, 4, 1), date(2026, 4, 20), load_holidays())
    assert status.working_days_remaining == 9
