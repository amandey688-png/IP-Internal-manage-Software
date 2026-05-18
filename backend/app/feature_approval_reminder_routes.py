"""Feature approval reminder API: recipients, schedule, cron runner, logs, test email."""
from __future__ import annotations

import os

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from app.auth_middleware import get_current_user, get_current_user_optional
from app.feature_approval_reminder_service import (
    add_recipient,
    delete_recipient,
    get_schedule,
    list_recipients,
    recent_logs,
    run_feature_approval_reminder_batch,
    send_test_email,
    update_recipient,
    upsert_schedule,
)

feature_approval_reminder_router = APIRouter(tags=["feature-approval-reminders"])


def _role(user_id: str) -> str:
    from app.main import _get_role_from_profile

    return _get_role_from_profile(user_id)


def _require_admin(auth: dict = Depends(get_current_user)) -> dict:
    if _role(auth["id"]) not in ("admin", "master_admin"):
        raise HTTPException(status_code=403, detail="Admin or Master Admin only")
    return auth


def _cron_or_admin(request: Request, auth: dict | None = Depends(get_current_user_optional)) -> dict:
    secret = (
        os.getenv("FEATURE_APPROVAL_CRON_SECRET")
        or os.getenv("NOTIFICATION_CRON_SECRET")
        or os.getenv("CHECKLIST_CRON_SECRET")
        or ""
    ).strip()
    hdr = (request.headers.get("X-Cron-Secret") or request.headers.get("x-cron-secret") or "").strip()
    if secret and hdr == secret:
        return {"cron": True}
    if auth and _role(auth["id"]) in ("admin", "master_admin"):
        return auth
    raise HTTPException(
        status_code=401,
        detail="Set FEATURE_APPROVAL_CRON_SECRET and X-Cron-Secret header, or sign in as Admin.",
    )


class RecipientCreate(BaseModel):
    email: EmailStr
    name: str = ""


class RecipientPatch(BaseModel):
    name: str | None = None
    is_enabled: bool | None = None


class ScheduleUpdate(BaseModel):
    enabled: bool = True
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(..., ge=0, le=59)
    timezone: str = "Asia/Kolkata"


class TestEmailBody(BaseModel):
    to: EmailStr


class RunBody(BaseModel):
    force: bool = False


@feature_approval_reminder_router.get("/feature-approval-reminders/ping")
def feature_approval_reminders_ping():
    return {"ok": True, "routes": "feature-approval-reminders-v1"}


@feature_approval_reminder_router.get("/feature-approval-reminders/recipients")
def get_recipients(_auth: dict = Depends(_require_admin)):
    try:
        return {"items": list_recipients()}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Run database/FEATURE_APPROVAL_REMINDER_SYSTEM.sql — {str(e)[:160]}",
        ) from e


@feature_approval_reminder_router.post("/feature-approval-reminders/recipients")
def post_recipient(body: RecipientCreate, _auth: dict = Depends(_require_admin)):
    try:
        return add_recipient(str(body.email), body.name or "")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        err = str(e).lower()
        if "duplicate" in err or "unique" in err or "23505" in err:
            raise HTTPException(status_code=400, detail="This email is already in the list") from e
        raise HTTPException(status_code=503, detail=str(e)[:200]) from e


@feature_approval_reminder_router.patch("/feature-approval-reminders/recipients/{recipient_id}")
def patch_recipient(
    recipient_id: str, body: RecipientPatch, _auth: dict = Depends(_require_admin)
):
    try:
        return update_recipient(
            recipient_id, name=body.name, is_enabled=body.is_enabled
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@feature_approval_reminder_router.delete("/feature-approval-reminders/recipients/{recipient_id}")
def remove_recipient(recipient_id: str, _auth: dict = Depends(_require_admin)):
    delete_recipient(recipient_id)
    return {"ok": True}


@feature_approval_reminder_router.get("/feature-approval-reminders/schedule")
def schedule_get(_auth: dict = Depends(_require_admin)):
    return get_schedule()


@feature_approval_reminder_router.put("/feature-approval-reminders/schedule")
def schedule_put(body: ScheduleUpdate, _auth: dict = Depends(_require_admin)):
    try:
        return upsert_schedule(
            enabled=body.enabled,
            hour=body.hour,
            minute=body.minute,
            timezone_name=body.timezone,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@feature_approval_reminder_router.get("/feature-approval-reminders/logs")
def logs_get(limit: int = 40, _auth: dict = Depends(_require_admin)):
    return {"items": recent_logs(limit)}


@feature_approval_reminder_router.post("/feature-approval-reminders/test-email")
async def test_email(body: TestEmailBody, _auth: dict = Depends(_require_admin)):
    ok, err = await send_test_email(str(body.to))
    if not ok:
        raise HTTPException(status_code=500, detail=err or "Send failed")
    return {"ok": True, "to": str(body.to)}


def _queue_reminder_batch(background_tasks: BackgroundTasks, *, force: bool) -> dict:
    """Run batch in background — avoids Render/Vercel HTTP timeout on large mail builds."""

    def _sync_run() -> None:
        import asyncio

        asyncio.run(run_feature_approval_reminder_batch(force=force))

    background_tasks.add_task(_sync_run)
    return {
        "status": "accepted",
        "force": force,
        "message": "Reminder job started. Refresh the send log below in 10–30 seconds.",
    }


@feature_approval_reminder_router.post("/feature-approval-reminders/run")
async def run_reminder(
    background_tasks: BackgroundTasks,
    _ctx: dict = Depends(_cron_or_admin),
    body: RunBody | None = Body(None),
    sync: bool = False,
):
    """
    Cron + admin force-send run in background (avoids HTTP timeout on Render).
    Add ?sync=true to wait for full JSON result (local debugging).
    """

    force_flag = bool(body.force) if body else False

    if sync and not _ctx.get("cron"):
        result = await run_feature_approval_reminder_batch(force=force_flag)
        if result.get("ok") is False:
            raise HTTPException(status_code=500, detail=result.get("error") or "Run failed")
        return result

    return _queue_reminder_batch(background_tasks, force=force_flag)
