"""
Unified email scheduler (cron-job.org style schedules in Settings).

Render Cron: GET /scheduler/tick every 5 minutes with X-Cron-Secret.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from app.cron_schedule_utils import (
    build_cron_expression,
    normalize_schedule,
    schedule_summary,
    validate_schedule_payload,
)
from app.supabase_client import supabase

_log = logging.getLogger("email_scheduler")
DEFAULT_TZ = "Asia/Kolkata"
_IST = timezone(timedelta(hours=5, minutes=30))
TICK_WINDOW_MINUTES = 10

JOB_KEYS = (
    "feature_approval",
    "checklist_daily",
    "delegation_daily",
    "escalation_pending",
    "escalation_critical",
    "escalation_stages",
)

DEFAULT_JOBS: dict[str, dict[str, Any]] = {
    "feature_approval": {
        "label": "Feature Approval Reminder",
        "schedule_type": "daily",
        "hour": 8,
        "minute": 7,
    },
    "checklist_daily": {
        "label": "Checklist Daily Reminder (per doer)",
        "schedule_type": "daily",
        "hour": 8,
        "minute": 0,
    },
    "delegation_daily": {
        "label": "Delegation Daily Reminder (per assignee)",
        "schedule_type": "daily",
        "hour": 8,
        "minute": 15,
    },
    "escalation_pending": {
        "label": "Escalation — Pending Timeframe",
        "schedule_type": "daily",
        "hour": 9,
        "minute": 0,
    },
    "escalation_critical": {
        "label": "Escalation — Critical 72hr+",
        "schedule_type": "daily",
        "hour": 9,
        "minute": 5,
    },
    "escalation_stages": {
        "label": "Escalation — Stage 2 / 3 / 4",
        "schedule_type": "daily",
        "hour": 9,
        "minute": 10,
    },
}


def _get_tz(name: str | None):
    n = (name or DEFAULT_TZ).strip() or DEFAULT_TZ
    try:
        return ZoneInfo(n)
    except Exception:
        if n.lower() in ("asia/kolkata", "asia/calcutta"):
            return _IST
        return timezone.utc


def _row_to_schedule(job_key: str, row: dict[str, Any]) -> dict[str, Any]:
    base = {**DEFAULT_JOBS[job_key], "job_key": job_key}
    sched = normalize_schedule(row, base)
    sched["cron_expression"] = sched.get("cron_expression") or build_cron_expression(sched)
    sched["schedule_summary"] = schedule_summary(sched)
    return sched


def list_schedules() -> list[dict[str, Any]]:
    try:
        r = supabase.table("email_job_schedules").select("*").order("job_key").execute()
        rows = {row["job_key"]: row for row in (r.data or [])}
    except Exception as e:
        _log.warning("email_job_schedules missing: %s", e)
        rows = {}
    return [_row_to_schedule(key, rows.get(key) or {}) for key in JOB_KEYS]


def get_schedule(job_key: str) -> dict[str, Any]:
    if job_key not in JOB_KEYS:
        raise ValueError(f"Unknown job_key: {job_key}")
    for s in list_schedules():
        if s["job_key"] == job_key:
            return s
    raise ValueError(f"Unknown job_key: {job_key}")


def upsert_schedule(job_key: str, **fields: Any) -> dict[str, Any]:
    if job_key not in JOB_KEYS:
        raise ValueError(f"Unknown job_key: {job_key}")
    current = get_schedule(job_key)
    merged = {**current, **fields, "job_key": job_key}
    validate_schedule_payload(merged)
    expr = build_cron_expression(merged)
    row = {
        "job_key": job_key,
        "label": DEFAULT_JOBS[job_key]["label"],
        "enabled": bool(merged.get("enabled", True)),
        "schedule_type": merged["schedule_type"],
        "interval_minutes": merged.get("interval_minutes"),
        "hour": int(merged["hour"]),
        "minute": int(merged["minute"]),
        "day_of_month": int(merged.get("day_of_month") or 1),
        "month": int(merged.get("month") or 1),
        "cron_expression": expr,
        "timezone": merged["timezone"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    supabase.table("email_job_schedules").upsert(row, on_conflict="job_key").execute()
    if job_key == "feature_approval" and merged.get("schedule_type") == "daily":
        _sync_legacy_feature_schedule(
            bool(merged.get("enabled", True)),
            int(merged["hour"]),
            int(merged["minute"]),
            str(merged["timezone"]),
        )
    return get_schedule(job_key)


def _sync_legacy_feature_schedule(enabled: bool, hour: int, minute: int, tz: str) -> None:
    try:
        supabase.table("feature_approval_schedule").upsert(
            {
                "id": 1,
                "enabled": enabled,
                "hour": hour,
                "minute": minute,
                "timezone": tz,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="id",
        ).execute()
    except Exception as e:
        _log.warning("feature_approval_schedule sync: %s", e)


def is_schedule_due(sched: dict[str, Any], *, window_minutes: int = TICK_WINDOW_MINUTES) -> bool:
    from app.cron_schedule_utils import is_schedule_due as _due

    tz = _get_tz(str(sched.get("timezone") or DEFAULT_TZ))
    now = datetime.now(tz)
    return _due(sched, now, window_minutes=window_minutes)


async def _run_job(job_key: str, *, force: bool) -> dict[str, Any]:
    if job_key == "feature_approval":
        from app.feature_approval_reminder_service import run_feature_approval_reminder_batch

        return await run_feature_approval_reminder_batch(force=force)

    if job_key == "checklist_daily":
        from app.main import _run_checklist_reminders_impl

        return await _run_checklist_reminders_impl(force_resend=force)

    if job_key == "delegation_daily":
        from app.main import _run_delegation_reminders_impl

        return await _run_delegation_reminders_impl(force_resend=force)

    if job_key == "escalation_pending":
        from app.escalation_email_service import run_escalation_batch

        return await run_escalation_batch("pending_timeframe", force=force, trigger_source="scheduler")

    if job_key == "escalation_critical":
        from app.escalation_email_service import run_escalation_batch

        return await run_escalation_batch("critical_pending", force=force, trigger_source="scheduler")

    if job_key == "escalation_stages":
        from app.escalation_email_service import run_all_stage_batches

        return await run_all_stage_batches(force=force)

    return {"ok": False, "error": f"unknown job {job_key}"}


def _summarize_job_result(job_key: str, result: dict[str, Any]) -> dict[str, Any]:
    sent = int(result.get("sent_ok") or result.get("emails_sent") or 0)
    if result.get("skipped"):
        return {
            "job_key": job_key,
            "ran": False,
            "email_sent": False,
            "reason": result.get("reason"),
        }
    if result.get("ok") is False:
        return {
            "job_key": job_key,
            "ran": True,
            "email_sent": False,
            "error": result.get("error"),
        }
    if job_key == "escalation_stages" and result.get("results"):
        total = sum(int((result["results"].get(k) or {}).get("sent_ok") or 0) for k in result["results"])
        return {"job_key": job_key, "ran": True, "email_sent": total > 0, "emails_sent": total}
    return {
        "job_key": job_key,
        "ran": True,
        "email_sent": sent > 0,
        "emails_sent": sent,
        "reason": result.get("reason"),
    }


async def run_scheduler_tick(*, force: bool = False, job_key: str | None = None) -> dict[str, Any]:
    schedules = list_schedules()
    if job_key:
        schedules = [s for s in schedules if s["job_key"] == job_key]
        if not schedules:
            return {"ok": False, "error": f"Unknown job_key: {job_key}"}

    results: list[dict[str, Any]] = []
    for sched in schedules:
        key = sched["job_key"]
        if not force and not is_schedule_due(sched):
            results.append({
                "job_key": key,
                "ran": False,
                "email_sent": False,
                "reason": "not_due",
                "schedule_summary": sched.get("schedule_summary"),
            })
            continue
        try:
            raw = await _run_job(key, force=force)
            results.append(_summarize_job_result(key, raw))
        except Exception as e:
            _log.exception("scheduler job %s failed", key)
            results.append({"job_key": key, "ran": True, "email_sent": False, "error": str(e)[:300]})

    any_sent = any(r.get("email_sent") for r in results)
    any_error = any(r.get("error") for r in results)
    return {
        "ok": not any_error,
        "force": force,
        "tick_window_minutes": TICK_WINDOW_MINUTES,
        "jobs": results,
        "any_email_sent": any_sent,
    }
