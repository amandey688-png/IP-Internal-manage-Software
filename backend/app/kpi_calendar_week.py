"""
KPI Dashboard: calendar-aligned Monday–Sunday weeks with cross-month merging.

Week N of (year, month) is the N-th Monday-offset week anchored to the ISO week that
contains the 1st of that month — same rule as frontend `kpiWeekUtils`.

Example: April 2026 Week 5 and May 2026 Week 1 both map to Mon 2026-04-27 .. Sun 2026-05-03.
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import TypedDict


class WeekMergeMeta(TypedDict, total=False):
    """Fields for merged calendar week; ``mergedWeekKey`` supports client cache keys."""

    mergedWeekKey: str
    startDate: str
    endDate: str
    spansPreviousMonth: bool
    spansNextMonth: bool
    mergeBadge: str
    tooltip: str


def merged_week_key_from_range(week_start: date, week_end: date) -> str:
    return f"{week_start.isoformat()}_{week_end.isoformat()}"


def kpi_anchor_monday_for_month(year: int, month: int) -> date:
    """Monday of the ISO week containing the first day of month (Python weekday: Mon=0)."""
    first = date(year, month, 1)
    return first - timedelta(days=first.weekday())


def kpi_max_week_index_in_month(year: int, month: int) -> int:
    """Largest KPI week index (1-based) intersecting this calendar month (may be 6)."""
    _, last_dom = calendar.monthrange(year, month)
    anchor = kpi_anchor_monday_for_month(year, month)
    max_w = 1
    for dom in range(1, last_dom + 1):
        d = date(year, month, dom)
        w = (d - anchor).days // 7 + 1
        max_w = max(max_w, w)
    return max(1, max_w)


def get_kpi_calendar_week_range(year: int, month_num: int, week_index: int) -> tuple[date, date] | None:
    """Full Monday–Sunday range for KPI week slot; may extend outside the selected month."""
    if week_index < 1:
        return None
    max_w = kpi_max_week_index_in_month(year, month_num)
    if week_index > max_w:
        return None
    anchor = kpi_anchor_monday_for_month(year, month_num)
    start = anchor + timedelta(weeks=week_index - 1)
    end = start + timedelta(days=6)
    return start, end


def week_of_month_for_date(d: date) -> int:
    """Week index (1+) for anchor month of ``d``: which slot of ``d.year``/``d.month`` contains ``d``."""
    anchor = kpi_anchor_monday_for_month(d.year, d.month)
    idx = (d - anchor).days // 7 + 1
    return max(1, idx)


def build_week_merge_meta(
    selection_year: int,
    selection_month: int,
    week_start: date,
    week_end: date,
) -> WeekMergeMeta:
    merged_key = merged_week_key_from_range(week_start, week_end)
    month_start = date(selection_year, selection_month, 1)
    _, last_dom = calendar.monthrange(selection_year, selection_month)
    month_end = date(selection_year, selection_month, last_dom)
    spans_prev = week_start < month_start
    spans_next = week_end > month_end
    tooltip = "Calendar week overlaps two months · same data applies if you switch to previous/next month."

    badge = ""
    if spans_prev and spans_next:
        badge = "Merged (spans adjacent months)"
    elif spans_prev:
        badge = "Merged with previous calendar month"
    elif spans_next:
        badge = "Merged with next calendar month"

    return {
        "mergedWeekKey": merged_key,
        "startDate": week_start.isoformat(),
        "endDate": week_end.isoformat(),
        "spansPreviousMonth": spans_prev,
        "spansNextMonth": spans_next,
        "mergeBadge": badge,
        "tooltip": tooltip if badge else "",
    }


def prior_kpi_calendar_week_range(week_start: date) -> tuple[date, date]:
    """The Monday–Sunday week immediately before the week beginning ``week_start``."""
    prev_end = week_start - timedelta(days=1)
    prev_start = week_start - timedelta(days=7)
    return prev_start, prev_end
