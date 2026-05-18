"""
Advanced Pending Escalation & Approval Email Configuration — business logic.
"""
from __future__ import annotations

import asyncio
import html
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

from app.escalation_email_templates import (
    build_critical_html,
    build_stage_html,
    build_timeframe_html,
)
from app.reminder_utils import get_chores_bugs_stage, get_staging_feature_stage, is_chores_bug_pending
from app.supabase_client import supabase
from app.utils.email import send_email_detail

_log = logging.getLogger("escalation_email")

EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
DEFAULT_TZ = "Asia/Kolkata"
MAX_RETRIES = 3
RETRY_BASE_SEC = 1.5

CONFIG_TYPES = (
    "pending_timeframe",
    "critical_pending",
    "stage_2",
    "stage_3",
    "stage_4",
)

_IST_FIXED = timezone(timedelta(hours=5, minutes=30))

TICKET_SELECT = (
    "id, reference_no, title, description, type, status, status_1, status_2, status_3, status_4, "
    "quality_solution, staging_planned, staging_review_status, live_review_status, live_status, "
    "assignee_id, created_at, query_arrival_at, planned_2, actual_2, planned_3, actual_3, "
    "planned_4, actual_4, resolved_at, company_name"
)


def _notify(msg: str) -> None:
    _log.warning(msg)


def _get_tz(tz_name: str | None):
    name = (tz_name or DEFAULT_TZ).strip() or DEFAULT_TZ
    try:
        return ZoneInfo(name)
    except Exception:
        pass
    if name.lower() in ("asia/kolkata", "asia/calcutta"):
        return _IST_FIXED
    return timezone.utc


def valid_email(s: str) -> bool:
    s = (s or "").strip()
    return bool(s and EMAIL_RE.match(s))


def _parse_ts(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        ts = str(s).replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def _hours_pending(since_iso: str | None) -> float:
    start = _parse_ts(since_iso)
    if not start:
        return 0.0
    return max(0.0, (datetime.now(timezone.utc) - start).total_seconds() / 3600.0)


def _timeframe_bucket(hours: float) -> str | None:
    if 24 <= hours < 48:
        return "24_48"
    if 48 <= hours < 72:
        return "48_72"
    if hours >= 72:
        return "72_plus"
    return None


def _format_delay(hours: float) -> str:
    if hours < 1:
        return f"{int(hours * 60)}m"
    if hours < 24:
        return f"{int(hours)}h"
    d = int(hours // 24)
    h = int(hours % 24)
    return f"{d}d {h}h" if h else f"{d}d"


def _format_dt_local(iso: str | None, tz_name: str = DEFAULT_TZ) -> str:
    dt = _parse_ts(iso)
    if not dt:
        return "—"
    try:
        local = dt.astimezone(_get_tz(tz_name))
        return local.strftime("%d %b %Y, %H:%M")
    except Exception:
        return str(iso)[:19] if iso else "—"


def _desc_preview(text: str | None, max_len: int = 140) -> str:
    s = (text or "").strip().replace("\r\n", " ")
    if not s:
        return "—"
    return s if len(s) <= max_len else s[: max_len - 1].rstrip() + "…"


def _ticket_ref(t: dict[str, Any]) -> str:
    return (t.get("reference_no") or "").strip() or str(t.get("id", ""))[:8]


def _pending_since_iso(t: dict[str, Any], stage_num: int | None = None) -> str:
    if t.get("staging_planned") or t.get("status_2") == "staging":
        return str(t.get("staging_planned") or t.get("query_arrival_at") or t.get("created_at") or "")
    if stage_num == 3:
        return str(t.get("actual_2") or t.get("planned_3") or t.get("query_arrival_at") or t.get("created_at") or "")
    if stage_num == 4:
        return str(t.get("actual_3") or t.get("planned_4") or t.get("query_arrival_at") or t.get("created_at") or "")
    return str(t.get("query_arrival_at") or t.get("created_at") or "")


def _is_open_ticket(t: dict[str, Any]) -> bool:
    if str(t.get("status_4") or "").lower() in ("completed", "complete", "done"):
        return False
    if t.get("resolved_at"):
        return False
    st = (t.get("status") or "").lower()
    if st in ("completed", "resolved", "closed", "cancelled", "fixed"):
        return False
    if t.get("live_review_status") == "completed" and not t.get("staging_planned"):
        return False
    return True


def get_user_display_map(user_ids: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    ids = [str(x) for x in user_ids if x]
    if not ids:
        return out
    try:
        r = supabase.table("user_profiles").select("id, email, full_name").in_("id", ids).execute()
        for p in r.data or []:
            uid = str(p.get("id", ""))
            out[uid] = (p.get("full_name") or "").strip() or (p.get("email") or "").strip() or "User"
    except Exception as e:
        _notify(f"user_profiles: {e}")
    return out


def _assignee_name(t: dict[str, Any], user_map: dict[str, str]) -> str:
    aid = str(t.get("assignee_id") or "")
    return user_map.get(aid, "—") if aid else "—"


def _to_row(t: dict[str, Any], user_map: dict[str, str], stage_num: int | None = None) -> dict[str, Any]:
    since = _pending_since_iso(t, stage_num)
    hours = _hours_pending(since)
    if t.get("type") in ("chore", "bug"):
        stage = get_chores_bugs_stage(t)
        stage_label = stage["stage_label"]
    else:
        stage = get_staging_feature_stage(t)
        stage_label = stage["stage_label"]
    return {
        "reference": _ticket_ref(t),
        "title": (t.get("title") or "—")[:120],
        "description": _desc_preview(t.get("description")),
        "assignee": _assignee_name(t, user_map),
        "stage_label": stage_label,
        "pending_since": _format_dt_local(since),
        "delay": _format_delay(hours),
        "hours": hours,
        "ticket_type": (t.get("type") or "—").capitalize(),
    }


# ---------------------------------------------------------------------------
# Config & recipients (DB)
# ---------------------------------------------------------------------------


def ensure_configs() -> None:
    for ctype, label in [
        ("pending_timeframe", "Pending Timeframe Escalation"),
        ("critical_pending", "Critical Pending Escalation"),
        ("stage_2", "Stage 2 Pending"),
        ("stage_3", "Stage 3 Pending"),
        ("stage_4", "Stage 4 Pending"),
    ]:
        try:
            ex = (
                supabase.table("escalation_email_config")
                .select("id")
                .eq("configuration_type", ctype)
                .limit(1)
                .execute()
            )
            if not ex.data:
                supabase.table("escalation_email_config").insert(
                    {"configuration_type": ctype, "stage_name": label, "is_enabled": True}
                ).execute()
        except Exception as e:
            _notify(f"ensure_configs {ctype}: {e}")


def list_all_configs() -> list[dict[str, Any]]:
    ensure_configs()
    r = supabase.table("escalation_email_config").select("*").order("configuration_type").execute()
    configs = r.data or []
    rec_r = supabase.table("escalation_email_receivers").select("*").order("created_at").execute()
    receivers = rec_r.data or []
    by_config: dict[str, list] = {}
    for rec in receivers:
        cid = str(rec.get("config_id", ""))
        by_config.setdefault(cid, []).append(rec)
    out = []
    for c in configs:
        cid = str(c["id"])
        out.append({**c, "receivers": by_config.get(cid, [])})
    return out


def get_config_by_type(configuration_type: str) -> dict[str, Any] | None:
    r = (
        supabase.table("escalation_email_config")
        .select("*")
        .eq("configuration_type", configuration_type)
        .limit(1)
        .execute()
    )
    return (r.data or [None])[0]


def patch_config(configuration_type: str, *, is_enabled: bool | None = None) -> dict[str, Any]:
    data: dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if is_enabled is not None:
        data["is_enabled"] = bool(is_enabled)
    r = (
        supabase.table("escalation_email_config")
        .update(data)
        .eq("configuration_type", configuration_type)
        .execute()
    )
    if not r.data:
        raise ValueError("Configuration not found")
    return r.data[0]


def add_receivers(
    configuration_type: str,
    emails: list[str],
    *,
    created_by: str | None = None,
) -> list[dict[str, Any]]:
    cfg = get_config_by_type(configuration_type)
    if not cfg:
        raise ValueError("Configuration not found")
    config_id = cfg["id"]
    added: list[dict[str, Any]] = []
    for raw in emails:
        em = raw.strip().lower()
        if not em or not valid_email(em):
            continue
        try:
            row = {
                "config_id": config_id,
                "email": em,
                "is_enabled": True,
                "created_by": created_by,
            }
            ins = supabase.table("escalation_email_receivers").insert(row).execute()
            if ins.data:
                added.append(ins.data[0])
        except Exception as e:
            err = str(e).lower()
            if "duplicate" not in err and "unique" not in err and "23505" not in err:
                _notify(f"add_receiver {em}: {e}")
    return added


def parse_bulk_emails(text: str) -> list[str]:
    parts = re.split(r"[,;\s]+", (text or "").strip())
    return [p.strip().lower() for p in parts if p.strip() and valid_email(p.strip())]


def update_receiver(receiver_id: str, *, is_enabled: bool | None = None) -> dict[str, Any]:
    data: dict[str, Any] = {}
    if is_enabled is not None:
        data["is_enabled"] = bool(is_enabled)
    if not data:
        raise ValueError("No fields to update")
    r = supabase.table("escalation_email_receivers").update(data).eq("id", receiver_id).execute()
    if not r.data:
        raise ValueError("Recipient not found")
    return r.data[0]


def delete_receiver(receiver_id: str) -> None:
    supabase.table("escalation_email_receivers").delete().eq("id", receiver_id).execute()


def _enabled_recipients(configuration_type: str) -> list[str]:
    cfg = get_config_by_type(configuration_type)
    if not cfg or not cfg.get("is_enabled"):
        return []
    rec_r = (
        supabase.table("escalation_email_receivers")
        .select("email, is_enabled")
        .eq("config_id", cfg["id"])
        .execute()
    )
    return [
        (r.get("email") or "").strip().lower()
        for r in (rec_r.data or [])
        if r.get("is_enabled") and valid_email(r.get("email"))
    ]


# ---------------------------------------------------------------------------
# Ticket queries
# ---------------------------------------------------------------------------


def _fetch_escalation_tickets() -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    try:
        cb = (
            supabase.table("tickets")
            .select(TICKET_SELECT)
            .in_("type", ["chore", "bug"])
            .is_("quality_solution", "null")
            .execute()
        )
        rows.extend(cb.data or [])
    except Exception as e:
        _notify(f"fetch chores/bugs: {e}")
    try:
        st = (
            supabase.table("tickets")
            .select(TICKET_SELECT)
            .or_("staging_planned.not.is.null,status_2.eq.staging")
            .or_("live_review_status.is.null,live_review_status.neq.completed")
            .execute()
        )
        seen = {str(t["id"]) for t in rows}
        for t in st.data or []:
            if str(t["id"]) not in seen:
                rows.append(t)
                seen.add(str(t["id"]))
    except Exception as e:
        _notify(f"fetch staging: {e}")
    return [t for t in rows if _is_open_ticket(t)]


def _eligible_timeframe_items() -> list[dict[str, Any]]:
    tickets = _fetch_escalation_tickets()
    user_map = get_user_display_map([str(t.get("assignee_id")) for t in tickets if t.get("assignee_id")])
    items: list[dict[str, Any]] = []
    for t in tickets:
        if t.get("type") in ("chore", "bug") and not is_chores_bug_pending(t):
            continue
        row = _to_row(t, user_map)
        bucket = _timeframe_bucket(row["hours"])
        if bucket:
            row["bucket"] = bucket
            items.append(row)
    return items


def _eligible_critical_items() -> dict[str, list[dict[str, Any]]]:
    tickets = _fetch_escalation_tickets()
    user_map = get_user_display_map([str(t.get("assignee_id")) for t in tickets if t.get("assignee_id")])
    chores: list[dict[str, Any]] = []
    bugs: list[dict[str, Any]] = []
    staging: list[dict[str, Any]] = []
    for t in tickets:
        row = _to_row(t, user_map)
        if row["hours"] < 72:
            continue
        tp = t.get("type")
        if tp == "chore":
            chores.append(row)
        elif tp == "bug":
            bugs.append(row)
        elif t.get("staging_planned") or t.get("status_2") == "staging":
            staging.append(row)
        elif tp in ("chore", "bug"):
            if tp == "chore":
                chores.append(row)
            else:
                bugs.append(row)
    return {"Chores": chores, "Bugs": bugs, "Staging": staging}


def _eligible_stage_items(stage_num: int) -> list[dict[str, Any]]:
    tickets = _fetch_escalation_tickets()
    user_map = get_user_display_map([str(t.get("assignee_id")) for t in tickets if t.get("assignee_id")])
    items: list[dict[str, Any]] = []
    for t in tickets:
        if t.get("type") not in ("chore", "bug"):
            continue
        stage = get_chores_bugs_stage(t)
        if stage.get("stage_num") != stage_num:
            continue
        row = _to_row(t, user_map, stage_num)
        items.append(row)
    return items


# ---------------------------------------------------------------------------
# Dedup, logs, send
# ---------------------------------------------------------------------------


def _daily_dedup_key(configuration_type: str) -> str:
    tz = _get_tz(DEFAULT_TZ)
    today = datetime.now(tz).date().isoformat()
    return f"{configuration_type}:daily:{today}"


def try_claim_dedup(key: str) -> bool:
    try:
        ex = supabase.table("escalation_reminder_dedup").select("dedup_key").eq("dedup_key", key).limit(1).execute()
        if ex.data:
            return False
        supabase.table("escalation_reminder_dedup").insert({"dedup_key": key}).execute()
        return True
    except Exception as e:
        err = str(e).lower()
        if "duplicate" in err or "unique" in err or "23505" in err:
            return False
        _notify(f"dedup: {e}")
        return False


def release_dedup(key: str) -> None:
    try:
        supabase.table("escalation_reminder_dedup").delete().eq("dedup_key", key).execute()
    except Exception as e:
        _notify(f"release_dedup: {e}")


def log_send(
    *,
    configuration_type: str,
    recipient: str,
    subject: str,
    total_pending: int,
    status: str,
    error_message: str | None = None,
    metadata: dict | None = None,
) -> str | None:
    try:
        ins = supabase.table("escalation_send_logs").insert(
            {
                "configuration_type": configuration_type,
                "recipient": recipient[:500],
                "subject": subject[:500],
                "total_pending": int(total_pending),
                "status": status[:50],
                "sent_at": datetime.now(timezone.utc).isoformat(),
                "error_message": (error_message or "")[:2000] or None,
                "metadata": metadata or {},
            }
        ).execute()
        if ins.data:
            return str(ins.data[0].get("id", ""))
    except Exception as e:
        _notify(f"log_send: {e}")
    return None


def log_manual_trigger(
    *,
    configuration_type: str,
    triggered_by: str | None,
    trigger_source: str,
    force_bypass: bool,
    result: dict,
) -> None:
    try:
        supabase.table("escalation_manual_trigger_logs").insert(
            {
                "configuration_type": configuration_type,
                "triggered_by": triggered_by,
                "trigger_source": trigger_source,
                "force_bypass": force_bypass,
                "result": result,
            }
        ).execute()
    except Exception as e:
        _notify(f"manual_trigger_log: {e}")


def _touch_last_sent(configuration_type: str) -> None:
    try:
        supabase.table("escalation_email_config").update(
            {"last_sent_at": datetime.now(timezone.utc).isoformat()}
        ).eq("configuration_type", configuration_type).execute()
    except Exception as e:
        _notify(f"last_sent_at: {e}")


def recent_logs(limit: int = 50, configuration_type: str | None = None) -> list[dict[str, Any]]:
    lim = max(1, min(200, limit))
    q = supabase.table("escalation_send_logs").select("*").order("sent_at", desc=True).limit(lim)
    if configuration_type:
        q = q.eq("configuration_type", configuration_type)
    return (q.execute().data or [])


def recent_manual_triggers(limit: int = 30) -> list[dict[str, Any]]:
    lim = max(1, min(100, limit))
    r = (
        supabase.table("escalation_manual_trigger_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(lim)
        .execute()
    )
    return r.data or []


async def send_with_retries(to_email: str, subject: str, html_body: str, plain: str) -> tuple[bool, str | None]:
    last_err: str | None = None
    for attempt in range(MAX_RETRIES):
        ok, err = await send_email_detail(to_email, subject, html_body, plain_fallback=plain)
        if ok:
            return True, None
        last_err = err or "send failed"
        if attempt < MAX_RETRIES - 1:
            await asyncio.sleep(RETRY_BASE_SEC * (attempt + 1))
    return False, last_err


async def preview_html(configuration_type: str) -> str:
    if configuration_type == "pending_timeframe":
        items = _eligible_timeframe_items()
        grouped: dict[str, list] = {"24_48": [], "48_72": [], "72_plus": []}
        for it in items:
            grouped[it["bucket"]].append(it)
        critical = len(grouped["72_plus"])
        return build_timeframe_html(grouped, total=len(items), critical_count=critical)
    if configuration_type == "critical_pending":
        sections = _eligible_critical_items()
        total = sum(len(v) for v in sections.values())
        return build_critical_html(sections, total)
    if configuration_type in ("stage_2", "stage_3", "stage_4"):
        sn = int(configuration_type.split("_")[1])
        return build_stage_html(sn, _eligible_stage_items(sn))
    raise ValueError("Unknown configuration type")


async def send_test_email(configuration_type: str, to_email: str) -> tuple[bool, str | None]:
    if not valid_email(to_email):
        return False, "Invalid email"
    body = await preview_html(configuration_type)
    subj = f"[Test] Escalation — {configuration_type}"
    return await send_with_retries(to_email, subj, body, "Test escalation email — see HTML version.")


async def retry_failed_log(log_id: str) -> dict[str, Any]:
    r = supabase.table("escalation_send_logs").select("*").eq("id", log_id).limit(1).execute()
    row = (r.data or [None])[0]
    if not row or row.get("status") != "failed":
        raise ValueError("Log not found or not failed")
    ctype = row["configuration_type"]
    body = await preview_html(ctype)
    subj = row.get("subject") or f"Escalation retry — {ctype}"
    ok, err = await send_with_retries(row["recipient"], subj, body, "Escalation retry")
    log_send(
        configuration_type=ctype,
        recipient=row["recipient"],
        subject=subj,
        total_pending=row.get("total_pending") or 0,
        status="sent" if ok else "failed",
        error_message=err,
        metadata={"retry_of": log_id},
    )
    return {"ok": ok, "error": err}


async def run_escalation_batch(
    configuration_type: str,
    *,
    force: bool = False,
    triggered_by: str | None = None,
    trigger_source: str = "cron",
) -> dict[str, Any]:
    if configuration_type not in CONFIG_TYPES:
        return {"ok": False, "error": "invalid configuration_type"}

    cfg = get_config_by_type(configuration_type)
    if not cfg:
        return {"skipped": True, "reason": "config_missing"}
    if not force and not cfg.get("is_enabled"):
        return {"skipped": True, "reason": "disabled"}

    dedup_key = _daily_dedup_key(configuration_type)
    if not force:
        if not try_claim_dedup(dedup_key):
            return {"skipped": True, "reason": "already_sent_today", "dedup_key": dedup_key}

    try:
        recipients = _enabled_recipients(configuration_type)
        if not recipients:
            if not force:
                release_dedup(dedup_key)
            return {"skipped": True, "reason": "no_recipients"}

        if configuration_type == "pending_timeframe":
            items = _eligible_timeframe_items()
            if not items:
                if not force:
                    release_dedup(dedup_key)
                return {"skipped": True, "reason": "no_tickets"}
            grouped: dict[str, list] = {"24_48": [], "48_72": [], "72_plus": []}
            for it in items:
                grouped[it["bucket"]].append(it)
            html_body = build_timeframe_html(
                grouped, total=len(items), critical_count=len(grouped["72_plus"])
            )
            subj = "[Pending Escalation Report] Tickets Pending in Different Timeframes"
            meta = {k: len(v) for k, v in grouped.items()}
            total = len(items)

        elif configuration_type == "critical_pending":
            sections = _eligible_critical_items()
            total = sum(len(v) for v in sections.values())
            if not total:
                if not force:
                    release_dedup(dedup_key)
                return {"skipped": True, "reason": "no_tickets"}
            html_body = build_critical_html(sections, total)
            subj = f"[CRITICAL] Pending Escalation — {total} ticket(s) 72hr+"
            meta = {k: len(v) for k, v in sections.items()}

        else:
            sn = int(configuration_type.split("_")[1])
            items = _eligible_stage_items(sn)
            if not items:
                if not force:
                    release_dedup(dedup_key)
                return {"skipped": True, "reason": "no_tickets"}
            html_body = build_stage_html(sn, items)
            subj = f"[Stage {sn}] Pending Notification — {len(items)} ticket(s)"
            meta = {"count": len(items)}
            total = len(items)

        plain = f"Escalation {configuration_type}: {total} ticket(s). Open the HTML email for details."
        ok_count = 0
        err_count = 0
        for em in recipients:
            success, err = await send_with_retries(em, subj, html_body, plain)
            if success:
                ok_count += 1
                log_send(
                    configuration_type=configuration_type,
                    recipient=em,
                    subject=subj,
                    total_pending=total,
                    status="sent",
                    metadata=meta,
                )
            else:
                err_count += 1
                log_send(
                    configuration_type=configuration_type,
                    recipient=em,
                    subject=subj,
                    total_pending=total,
                    status="failed",
                    error_message=err,
                    metadata=meta,
                )

        if ok_count > 0:
            _touch_last_sent(configuration_type)

        if not force and ok_count == 0 and err_count > 0:
            release_dedup(dedup_key)

        result = {
            "ok": True,
            "configuration_type": configuration_type,
            "pending": total,
            "recipients_attempted": len(recipients),
            "sent_ok": ok_count,
            "failed": err_count,
        }
        log_manual_trigger(
            configuration_type=configuration_type,
            triggered_by=triggered_by,
            trigger_source=trigger_source,
            force_bypass=force,
            result=result,
        )
        return result
    except Exception as e:
        _notify(f"batch {configuration_type}: {e}")
        if not force:
            release_dedup(dedup_key)
        return {"ok": False, "error": str(e)[:500]}


async def run_all_stage_batches(*, force: bool = False, triggered_by: str | None = None) -> dict[str, Any]:
    results = {}
    for ctype in ("stage_2", "stage_3", "stage_4"):
        results[ctype] = await run_escalation_batch(
            ctype, force=force, triggered_by=triggered_by, trigger_source="cron"
        )
    return {"ok": True, "results": results}


def get_pending_stats() -> dict[str, Any]:
    tf = _eligible_timeframe_items()
    grouped = {"24_48": 0, "48_72": 0, "72_plus": 0}
    for it in tf:
        grouped[it["bucket"]] = grouped.get(it["bucket"], 0) + 1
    crit = _eligible_critical_items()
    crit_total = sum(len(v) for v in crit.values())
    stages = {
        f"stage_{n}": len(_eligible_stage_items(n)) for n in (2, 3, 4)
    }
    return {
        "timeframe": grouped,
        "timeframe_total": len(tf),
        "critical_total": crit_total,
        "stages": stages,
    }
