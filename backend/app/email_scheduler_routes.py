"""Unified email scheduler API (Settings + Render Cron tick)."""
from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.auth_middleware import get_current_user, get_current_user_optional
from app.email_scheduler_service import JOB_KEYS, list_schedules, run_scheduler_tick, upsert_schedule

email_scheduler_router = APIRouter(tags=["email-scheduler"])


def _role(user_id: str) -> str:
    from app.main import _get_role_from_profile

    return _get_role_from_profile(user_id)


def _require_admin(auth: dict = Depends(get_current_user)) -> dict:
    if _role(auth["id"]) not in ("admin", "master_admin"):
        raise HTTPException(status_code=403, detail="Admin or Master Admin only")
    return auth


def _cron_authorized(request: Request) -> bool:
    hdr = (request.headers.get("X-Cron-Secret") or request.headers.get("x-cron-secret") or "").strip()
    auth_hdr = (request.headers.get("Authorization") or request.headers.get("authorization") or "").strip()
    bearer = auth_hdr[7:].strip() if auth_hdr.lower().startswith("bearer ") else ""
    for key in (
        "FEATURE_APPROVAL_CRON_SECRET",
        "CHECKLIST_CRON_SECRET",
        "NOTIFICATION_CRON_SECRET",
        "ESCALATION_CRON_SECRET",
        "SCHEDULER_CRON_SECRET",
    ):
        secret = (os.getenv(key) or "").strip()
        if secret and (hdr == secret or bearer == secret):
            return True
    return False


class ScheduleUpdate(BaseModel):
    enabled: bool = True
    schedule_type: str = Field(
        default="daily",
        description="every_minutes | daily | monthly | yearly | custom",
    )
    interval_minutes: int | None = Field(default=None, ge=5, le=60)
    hour: int = Field(default=8, ge=0, le=23)
    minute: int = Field(default=0, ge=0, le=59)
    day_of_month: int | None = Field(default=1, ge=1, le=31)
    month: int | None = Field(default=1, ge=1, le=12)
    cron_expression: str | None = None
    timezone: str = "Asia/Kolkata"


@email_scheduler_router.get("/scheduler/schedules")
def schedules_list(_auth: dict = Depends(_require_admin)):
    try:
        return {"items": list_schedules(), "job_keys": list(JOB_KEYS)}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Run database/EMAIL_JOB_SCHEDULES.sql — {str(e)[:160]}",
        ) from e


@email_scheduler_router.get("/scheduler/schedules/{job_key}")
def schedule_get(job_key: str, _auth: dict = Depends(_require_admin)):
    from app.email_scheduler_service import get_schedule

    try:
        return get_schedule(job_key)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@email_scheduler_router.put("/scheduler/schedules/{job_key}")
def schedule_put(job_key: str, body: ScheduleUpdate, _auth: dict = Depends(_require_admin)):
    try:
        return upsert_schedule(
            job_key,
            enabled=body.enabled,
            schedule_type=body.schedule_type,
            interval_minutes=body.interval_minutes,
            hour=body.hour,
            minute=body.minute,
            day_of_month=body.day_of_month,
            month=body.month,
            cron_expression=body.cron_expression,
            timezone=body.timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@email_scheduler_router.api_route("/scheduler/tick", methods=["GET", "POST"])
async def scheduler_tick(
    request: Request,
    force: bool = False,
    job: str | None = None,
    auth: dict | None = Depends(get_current_user_optional),
):
    """
    Render Cron: call every 5 minutes with X-Cron-Secret.
    Runs checklist/delegation/feature/escalation jobs when their configured local time is due.
  Admin: ?force=true&job=checklist_daily to test one job.
    """
    is_cron = _cron_authorized(request)
    is_admin = bool(auth and _role(auth["id"]) in ("admin", "master_admin"))
    if not is_cron and not is_admin:
        raise HTTPException(
            status_code=401,
            detail="Use X-Cron-Secret (Render Cron) or sign in as Admin.",
        )
    result = await run_scheduler_tick(force=force, job_key=job or None)
    if is_cron and not result.get("ok"):
        err = next((j.get("error") for j in result.get("jobs") or [] if j.get("error")), None)
        if err:
            raise HTTPException(status_code=500, detail=err)
    return result
