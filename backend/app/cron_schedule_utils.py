"""Cron-style schedule evaluation (cron-job.org compatible patterns)."""
from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

CRON_RE = re.compile(
    r"^(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)$"
)
SCHEDULE_TYPES = ("every_minutes", "daily", "monthly", "yearly", "custom")
MONTH_NAMES = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)


def normalize_schedule(row: dict[str, Any], defaults: dict[str, Any]) -> dict[str, Any]:
    st = (row.get("schedule_type") or defaults.get("schedule_type") or "daily").strip().lower()
    if st not in SCHEDULE_TYPES:
        st = "daily"
    return {
        "job_key": row.get("job_key") or defaults.get("job_key"),
        "label": row.get("label") or defaults.get("label", ""),
        "enabled": bool(row.get("enabled", defaults.get("enabled", True))),
        "schedule_type": st,
        "interval_minutes": int(row["interval_minutes"]) if row.get("interval_minutes") is not None else defaults.get("interval_minutes"),
        "hour": int(row.get("hour", defaults.get("hour", 8))),
        "minute": int(row.get("minute", defaults.get("minute", 0))),
        "day_of_month": int(row.get("day_of_month", defaults.get("day_of_month", 1))),
        "month": int(row.get("month", defaults.get("month", 1))),
        "cron_expression": (row.get("cron_expression") or defaults.get("cron_expression") or "").strip() or None,
        "timezone": (row.get("timezone") or defaults.get("timezone") or "Asia/Kolkata").strip(),
        "updated_at": row.get("updated_at"),
    }


def build_cron_expression(sched: dict[str, Any]) -> str | None:
    st = sched.get("schedule_type") or "daily"
    if st == "custom":
        return sched.get("cron_expression")
    if st == "every_minutes":
        iv = int(sched.get("interval_minutes") or 15)
        if iv < 1:
            iv = 15
        return f"*/{iv} * * * *"
    m = int(sched.get("minute", 0))
    h = int(sched.get("hour", 8))
    if st == "daily":
        return f"{m} {h} * * *"
    if st == "monthly":
        dom = int(sched.get("day_of_month") or 1)
        return f"{m} {h} {dom} * *"
    if st == "yearly":
        dom = int(sched.get("day_of_month") or 1)
        mon = int(sched.get("month") or 1)
        return f"{m} {h} {dom} {mon} *"
    return f"{m} {h} * * *"


def schedule_summary(sched: dict[str, Any]) -> str:
    st = sched.get("schedule_type") or "daily"
    tz = sched.get("timezone") or "Asia/Kolkata"
    h = int(sched.get("hour", 0))
    mi = int(sched.get("minute", 0))
    t = f"{h}:{mi:02d}"
    if st == "every_minutes":
        iv = int(sched.get("interval_minutes") or 15)
        return f"Every {iv} minutes ({tz})"
    if st == "daily":
        return f"Every day at {t} ({tz})"
    if st == "monthly":
        dom = int(sched.get("day_of_month") or 1)
        return f"Day {dom} of each month at {t} ({tz})"
    if st == "yearly":
        dom = int(sched.get("day_of_month") or 1)
        mon = int(sched.get("month") or 1)
        name = MONTH_NAMES[mon - 1] if 1 <= mon <= 12 else str(mon)
        return f"Every year on {dom} {name} at {t} ({tz})"
    if st == "custom":
        expr = sched.get("cron_expression") or build_cron_expression(sched)
        return f"Custom: {expr} ({tz})"
    return t


def validate_schedule_payload(sched: dict[str, Any]) -> None:
    st = sched.get("schedule_type") or "daily"
    if st not in SCHEDULE_TYPES:
        raise ValueError(f"schedule_type must be one of {SCHEDULE_TYPES}")
    h, mi = int(sched.get("hour", 0)), int(sched.get("minute", 0))
    if not (0 <= h <= 23 and 0 <= mi <= 59):
        raise ValueError("Invalid hour or minute")
    if st == "every_minutes":
        iv = int(sched.get("interval_minutes") or 0)
        if iv not in (5, 10, 15, 30, 60):
            raise ValueError("interval_minutes must be 5, 10, 15, 30, or 60")
    if st == "monthly" or st == "yearly":
        dom = int(sched.get("day_of_month") or 0)
        if not (1 <= dom <= 31):
            raise ValueError("day_of_month must be 1–31")
    if st == "yearly":
        mon = int(sched.get("month") or 0)
        if not (1 <= mon <= 12):
            raise ValueError("month must be 1–12")
    if st == "custom":
        expr = (sched.get("cron_expression") or "").strip()
        if not expr or not CRON_RE.match(expr):
            raise ValueError("cron_expression must be 5 fields, e.g. */15 * * * * or 7 8 * * *")


def _time_in_window(now: datetime, hour: int, minute: int, window_minutes: int) -> bool:
    if now.hour != hour:
        return False
    return minute <= now.minute < minute + window_minutes


def is_schedule_due(sched: dict[str, Any], now: datetime, *, window_minutes: int = 10) -> bool:
    if not sched.get("enabled", True):
        return False
    st = sched.get("schedule_type") or "daily"

    if st == "every_minutes":
        iv = int(sched.get("interval_minutes") or 15)
        total_m = now.hour * 60 + now.minute
        slot_start = (total_m // iv) * iv
        return total_m - slot_start < window_minutes

    if st == "daily":
        return _time_in_window(now, int(sched.get("hour", 0)), int(sched.get("minute", 0)), window_minutes)

    if st == "monthly":
        if now.day != int(sched.get("day_of_month") or 1):
            return False
        return _time_in_window(now, int(sched.get("hour", 0)), int(sched.get("minute", 0)), window_minutes)

    if st == "yearly":
        if now.month != int(sched.get("month") or 1) or now.day != int(sched.get("day_of_month") or 1):
            return False
        return _time_in_window(now, int(sched.get("hour", 0)), int(sched.get("minute", 0)), window_minutes)

    if st == "custom":
        expr = (sched.get("cron_expression") or build_cron_expression(sched) or "").strip()
        if not expr:
            return False
        return _cron_expression_due(expr, now, window_minutes=window_minutes)

    return False


def _cron_expression_due(expr: str, now: datetime, *, window_minutes: int) -> bool:
    try:
        from croniter import croniter
    except ImportError:
        return _cron_expression_due_simple(expr, now, window_minutes=window_minutes)

    try:
        base = now - timedelta(minutes=window_minutes)
        itr = croniter(expr, base)
        nxt = itr.get_next(datetime)
        if hasattr(nxt, "tzinfo") and nxt.tzinfo is None and now.tzinfo:
            nxt = nxt.replace(tzinfo=now.tzinfo)
        return nxt <= now
    except Exception:
        return _cron_expression_due_simple(expr, now, window_minutes=window_minutes)


def _cron_expression_due_simple(expr: str, now: datetime, *, window_minutes: int) -> bool:
    m = CRON_RE.match(expr.strip())
    if not m:
        return False
    min_f, hour_f, dom_f, mon_f, _dow = m.groups()
    if dom_f != "*" and int(dom_f) != now.day:
        return False
    if mon_f != "*" and int(mon_f) != now.month:
        return False
    if hour_f != "*" and int(hour_f) != now.hour:
        return False
    if min_f.startswith("*/"):
        step = int(min_f[2:])
        return now.minute % step < window_minutes
    if min_f != "*" and not _time_in_window(now, now.hour, int(min_f), window_minutes):
        return False
    return True
