"""
Checklist date logic: generate occurrence dates based on frequency.
D=Daily, 2D=Every 2 days, W=Weekly, 2W=Every 2 weeks, M=Monthly, Q=Quarterly, F=Half-yearly, Y=Yearly.
Excludes Sundays and holidays. For non-daily: if natural date is weekend/holiday,
use the previous working day (Mon-Sat, not holiday).
"""
from datetime import date, timedelta
from typing import Callable

# Weekday: Monday=0, Sunday=6
def _is_sunday(d: date) -> bool:
    return d.weekday() == 6

def _is_weekend(d: date) -> bool:
    return d.weekday() >= 5  # Sat=5, Sun=6

def _prev_working_day(d: date, is_holiday: Callable[[date], bool]) -> date:
    """Previous working day (Mon-Sat, not holiday)."""
    while True:
        d = d - timedelta(days=1)
        if d.weekday() < 6 and not is_holiday(d):  # not Sunday and not holiday
            return d

def _next_working_day(d: date, is_holiday: Callable[[date], bool]) -> date:
    """Next working day."""
    while True:
        if d.weekday() < 6 and not is_holiday(d):
            return d
        d = d + timedelta(days=1)

def get_occurrence_dates(
    start_date: date,
    frequency: str,
    year: int,
    is_holiday: Callable[[date], bool],
) -> list[date]:
    """
    Generate all occurrence dates for a task in the given year.
    Returns list of working-day dates (no Sunday, no holiday).
    For non-daily: if natural date is Sunday/holiday, use previous working day.
    """
    if frequency == "D":
        return _daily(start_date, year, is_holiday)
    if frequency == "2D":
        return _every_2_days(start_date, year, is_holiday)
    if frequency == "W":
        return _weekly(start_date, year, is_holiday)
    if frequency == "2W":
        return _every_2_weeks(start_date, year, is_holiday)
    if frequency == "M":
        return _monthly(start_date, year, is_holiday)
    if frequency == "Q":
        return _quarterly(start_date, year, is_holiday)
    if frequency == "F":
        return _half_yearly(start_date, year, is_holiday)
    if frequency == "Y":
        return _yearly(start_date, year, is_holiday)
    return []

def _ensure_working(d: date, is_holiday: Callable[[date], bool]) -> date:
    """If d is Sunday or holiday, return previous working day."""
    if _is_sunday(d) or is_holiday(d):
        return _prev_working_day(d, is_holiday)
    return d

def _daily(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    out = []
    d = start
    if d.year < year:
        d = date(year, 1, 1)
    if d.year > year:
        return []
    while d.year == year:
        if not _is_sunday(d) and not is_holiday(d):
            out.append(d)
        d = d + timedelta(days=1)
    return out

def _every_2_days(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    """Every 2 days from start_date (start, start+2, start+4, ...). Excludes Sunday and holiday."""
    out = []
    d = start
    if d.year > year:
        return []
    if d.year < year:
        # Advance to first occurrence in year: (year-01-01 - start).days, then align to 2-day step
        d0 = date(year, 1, 1)
        delta = (d0 - start).days
        remainder = delta % 2
        d = d0 + timedelta(days=(2 - remainder) % 2) if remainder else d0
    while d.year == year:
        if not _is_sunday(d) and not is_holiday(d):
            out.append(d)
        d = d + timedelta(days=2)
    return out

def _weekly(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    out = []
    weekday = start.weekday()
    d = date(year, 1, 1)
    while d.weekday() != weekday:
        d = d + timedelta(days=1)
    while d.year == year:
        if d >= start:
            out.append(_ensure_working(d, is_holiday))
        d = d + timedelta(days=7)
    return sorted(set(out))

def _every_2_weeks(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    """Every 2 weeks from start_date (same weekday, step 14 days). Uses previous working day if fall on Sunday/holiday."""
    out = []
    weekday = start.weekday()
    d = date(year, 1, 1)
    while d.weekday() != weekday:
        d = d + timedelta(days=1)
    # Align to 2-week cycle containing start_date
    if d < start:
        delta = (start - d).days
        step = (delta // 14) * 14
        d = d + timedelta(days=step)
        if d < start:
            d = d + timedelta(days=14)
    while d.year == year:
        if d >= start:
            out.append(_ensure_working(d, is_holiday))
        d = d + timedelta(days=14)
    return sorted(set(out))

def _monthly(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    out = []
    day = min(start.day, 28)
    for m in range(1, 13):
        try:
            d = date(year, m, day)
        except ValueError:
            d = date(year, m, 28)
        if d >= start:
            out.append(_ensure_working(d, is_holiday))
    return out

def _quarterly(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    out = []
    day = min(start.day, 28)
    for m in [1, 4, 7, 10]:
        try:
            d = date(year, m, day)
        except ValueError:
            d = date(year, m, 28)
        if d >= start:
            out.append(_ensure_working(d, is_holiday))
    return out

def _half_yearly(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    out = []
    day = min(start.day, 28)
    for m in [1, 7]:
        try:
            d = date(year, m, day)
        except ValueError:
            d = date(year, m, 28)
        if d >= start:
            out.append(_ensure_working(d, is_holiday))
    return out

def _yearly(start: date, year: int, is_holiday: Callable[[date], bool]) -> list[date]:
    try:
        d = date(year, start.month, min(start.day, 28))
    except ValueError:
        d = date(year, start.month, 28)
    if d >= start:
        return [_ensure_working(d, is_holiday)]
    return []
