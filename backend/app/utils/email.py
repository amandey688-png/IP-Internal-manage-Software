"""
Outbound email (Postmark SMTP primary) — aligned with IndustryPrime HRIS email_service.

Env (backend/.env or Render):
  EMAIL_MODE=postmark | log          # log = dry-run, no SMTP
  POSTMARK_SMTP_TOKEN=...            # required to send
  POSTMARK_SMTP_USERNAME=...         # optional PM-T-outbound-* stream
  POSTMARK_SMTP_HOST=smtp.postmarkapp.com
  POSTMARK_SMTP_PORT=587             # falls back to 2525 on Postmark
  POSTMARK_FROM_EMAIL / SMTP_FROM_EMAIL
  EMAIL_TEST_REDIRECT=you@example.com  # optional — all mail to one inbox
  EMAIL_PROVIDER=postmark            # prefer Postmark over legacy SMTP_HOST (Brevo)
"""
from __future__ import annotations

import os
from typing import Any

try:
    import httpx
except ImportError:
    httpx = None

_last_email_error: str | None = None
POSTMARK_PORTS = (587, 2525)


def get_last_email_error() -> str | None:
    return _last_email_error


def _log(msg: str) -> None:
    import sys
    print(f"[email] {msg}", file=sys.stderr, flush=True)


def _env_strip(key: str) -> str:
    return (os.getenv(key) or "").strip()


def _resolve_smtp_config() -> dict[str, Any]:
    postmark_token = _env_strip("POSTMARK_SMTP_TOKEN") or _env_strip("POSTMARK_SERVER_TOKEN")
    postmark_user = _env_strip("POSTMARK_SMTP_USERNAME")
    provider = _env_strip("EMAIL_PROVIDER").lower()
    use_postmark = provider in ("postmark", "smtp", "postmark-smtp") or bool(
        postmark_token or postmark_user.startswith("PM-T-") or _env_strip("POSTMARK_SMTP_HOST")
    )

    smtp_user = _env_strip("SMTP_USER")
    smtp_pass = _env_strip("SMTP_PASSWORD") or _env_strip("SMTP_PASS")

    if use_postmark:
        if postmark_user and postmark_token:
            username, password = postmark_user, postmark_token
        elif postmark_token:
            username = password = postmark_token
        else:
            username, password = postmark_user, postmark_token or smtp_pass
        host = _env_strip("POSTMARK_SMTP_HOST") or "smtp.postmarkapp.com"
        port_raw = _env_strip("POSTMARK_SMTP_PORT") or "587"
        from_email = (
            _env_strip("POSTMARK_FROM_EMAIL")
            or _env_strip("POSTMARK_SMTP_FROM")
            or _env_strip("SMTP_FROM_EMAIL")
        )
    else:
        username, password = smtp_user, smtp_pass
        host = _env_strip("SMTP_HOST")
        port_raw = _env_strip("SMTP_PORT") or "587"
        from_email = _env_strip("SMTP_FROM_EMAIL") or _env_strip("POSTMARK_FROM_EMAIL")

    try:
        port = int(port_raw)
    except ValueError:
        port = 587

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "use_postmark": use_postmark,
        "configured": bool(host and username and password and from_email),
    }


def get_email_mode() -> str:
    """postmark | sendgrid | log"""
    explicit = _env_strip("EMAIL_MODE").lower()
    if explicit in ("log", "local", "disabled", "dry_run", "off", "none"):
        return "log"
    if explicit in ("postmark", "smtp", "send"):
        return "postmark"
    if explicit == "sendgrid":
        return "sendgrid"
    cfg = _resolve_smtp_config()
    if cfg["configured"]:
        return "postmark"
    if _env_strip("SENDGRID_API_KEY"):
        return "sendgrid"
    return "log"


def get_email_delivery_status() -> dict[str, Any]:
    cfg = _resolve_smtp_config()
    mode = get_email_mode()
    return {
        "mode": mode,
        "credentials_loaded": bool(cfg.get("password")),
        "from_email": cfg.get("from_email") or None,
        "smtp_host": cfg.get("host") or None,
        "smtp_ports": list(POSTMARK_PORTS) if cfg.get("use_postmark") else [cfg.get("port")],
        "test_redirect": bool(_env_strip("EMAIL_TEST_REDIRECT")),
    }


def log_email_smtp_startup() -> None:
    st = get_email_delivery_status()
    _log(
        "Email delivery: "
        f"mode={st['mode']} "
        f"host={st['smtp_host'] or '-'} "
        f"ports={st['smtp_ports']} "
        f"credentials_loaded={st['credentials_loaded']} "
        f"from={st['from_email'] or '-'} "
        f"test_redirect={'yes' if st['test_redirect'] else 'no'}"
    )


def resolve_recipient(to_email: str, subject: str) -> tuple[str, str]:
    """Apply EMAIL_TEST_REDIRECT; prefix subject when redirected."""
    to_email = (to_email or "").strip()
    redirect = _env_strip("EMAIL_TEST_REDIRECT")
    if redirect and redirect.lower() != to_email.lower():
        return redirect, f"[TEST redirect] {subject}"
    return to_email, subject


def _prefer_smtp_over_sendgrid() -> bool:
    if get_email_mode() == "postmark":
        return True
    if _env_strip("EMAIL_USE_SMTP").lower() in ("1", "true", "yes", "smtp", "postmark"):
        return True
    cfg = _resolve_smtp_config()
    return cfg["configured"] and not _env_strip("SENDGRID_API_KEY")


async def _smtp_send(message: Any, cfg: dict[str, Any]) -> None:
    import aiosmtplib

    host = cfg["host"]
    ports: list[int] = []
    if cfg.get("use_postmark") or host == "smtp.postmarkapp.com":
        ports = list(POSTMARK_PORTS)
    else:
        ports = [int(cfg["port"])]

    last_err: Exception | None = None
    for port in ports:
        use_tls = port == 465
        start_tls = port in (587, 2525, 25) if not use_tls else False
        try:
            await aiosmtplib.send(
                message,
                hostname=host,
                port=port,
                username=cfg["username"],
                password=cfg["password"],
                use_tls=use_tls,
                start_tls=start_tls,
            )
            _log(f"SMTP OK ({host}:{port}) -> {message['To']}")
            return
        except Exception as e:
            last_err = e
            _log(f"SMTP try {host}:{port} failed: {e}")
    if last_err:
        raise last_err


async def send_email(to_email: str, subject: str, html_content: str, plain_fallback: str | None = None) -> bool:
    ok, _ = await send_email_detail(to_email, subject, html_content, plain_fallback)
    return ok


async def send_email_detail(
    to_email: str,
    subject: str,
    html_content: str,
    plain_fallback: str | None = None,
) -> tuple[bool, str | None]:
    global _last_email_error
    _last_email_error = None

    to_email = (to_email or "").strip()
    if not to_email:
        _last_email_error = "Recipient email is empty"
        return False, _last_email_error

    mode = get_email_mode()
    to_email, subject = resolve_recipient(to_email, subject)
    plain = (plain_fallback or "This email requires HTML support.").strip()

    if mode == "log":
        _log(f"EMAIL_MODE=log — would send to={to_email} subject={subject[:80]}")
        return True, None

    if not _prefer_smtp_over_sendgrid():
        sg_key = _env_strip("SENDGRID_API_KEY")
        sg_from = _env_strip("SENDGRID_FROM_EMAIL") or _resolve_smtp_config()["from_email"]
        sg_name = _env_strip("SENDGRID_FROM_NAME") or "IP Internal Management"
        if sg_key and httpx and sg_from:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.sendgrid.com/v3/mail/send",
                        headers={"Authorization": f"Bearer {sg_key}", "Content-Type": "application/json"},
                        json={
                            "personalizations": [{"to": [{"email": to_email}]}],
                            "from": {"email": sg_from, "name": sg_name},
                            "subject": subject,
                            "content": [
                                {"type": "text/plain", "value": plain},
                                {"type": "text/html", "value": html_content},
                            ],
                        },
                    )
                    if resp.status_code in (200, 202):
                        _log(f"SendGrid OK -> {to_email}")
                        return True, None
                    _last_email_error = f"SendGrid HTTP {resp.status_code}: {resp.text[:300]}"
                    _log(_last_email_error)
            except Exception as e:
                _last_email_error = f"SendGrid error: {e}"
                _log(_last_email_error)

    cfg = _resolve_smtp_config()
    if not cfg["configured"]:
        missing = []
        if not cfg["host"]:
            missing.append("POSTMARK_SMTP_HOST or SMTP_HOST")
        if not cfg["username"]:
            missing.append("POSTMARK_SMTP_TOKEN or SMTP_USER")
        if not cfg["password"]:
            missing.append("POSTMARK_SMTP_TOKEN or SMTP_PASSWORD")
        if not cfg["from_email"]:
            missing.append("POSTMARK_FROM_EMAIL or SMTP_FROM_EMAIL")
        _last_email_error = (
            "SMTP not configured — set POSTMARK_SMTP_TOKEN + POSTMARK_FROM_EMAIL in backend/.env "
            f"(missing: {', '.join(missing)}). Restart uvicorn after saving."
        )
        _log(_last_email_error)
        return False, _last_email_error

    from email.message import EmailMessage

    message = EmailMessage()
    message["From"] = cfg["from_email"]
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(plain)
    message.add_alternative(html_content, subtype="html")

    try:
        await _smtp_send(message, cfg)
        return True, None
    except Exception as e:
        _last_email_error = f"SMTP error ({cfg['host']}): {e}"
        _log(_last_email_error)
        return False, _last_email_error
