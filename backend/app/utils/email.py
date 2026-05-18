"""
Outbound email — Postmark HTTP API (Render-safe) then SMTP fallback.

Env (Render / backend/.env):
  POSTMARK_SMTP_TOKEN or POSTMARK_SERVER_TOKEN or POSTMARK_API_TOKEN
  POSTMARK_SMTP_USERNAME or SMTP_POSTMARK_STREAM  (PM-T-outbound-* or stream name)
  POSTMARK_FROM_EMAIL or SMTP_FROM_EMAIL
  EMAIL_MODE=postmark | log
  EMAIL_PROVIDER=postmark
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
POSTMARK_API_URL = "https://api.postmarkapp.com/email"


def get_last_email_error() -> str | None:
    return _last_email_error


def _log(msg: str) -> None:
    import sys
    print(f"[email] {msg}", file=sys.stderr, flush=True)


def _env_strip(key: str) -> str:
    return (os.getenv(key) or "").strip()


def _postmark_token() -> str:
    return (
        _env_strip("POSTMARK_SMTP_TOKEN")
        or _env_strip("POSTMARK_SERVER_TOKEN")
        or _env_strip("POSTMARK_API_TOKEN")
    )


def _postmark_stream_env() -> str:
    """SMTP username (PM-T-...) or API MessageStream name (e.g. outbound)."""
    return (
        _env_strip("POSTMARK_SMTP_USERNAME")
        or _env_strip("SMTP_POSTMARK_STREAM")
        or _env_strip("POSTMARK_MESSAGE_STREAM")
    )


def _api_message_stream(stream_env: str) -> str | None:
    s = (stream_env or "").strip()
    if not s:
        return None
    if s.startswith("PM-T-"):
        return "outbound"
    return s


def _resolve_smtp_config() -> dict[str, Any]:
    postmark_token = _postmark_token()
    postmark_user = _postmark_stream_env()
    smtp_user = _env_strip("SMTP_USER")
    smtp_pass = _env_strip("SMTP_PASSWORD") or _env_strip("SMTP_PASS")
    smtp_host = _env_strip("SMTP_HOST")
    provider = _env_strip("EMAIL_PROVIDER").lower()

    # Legacy: SMTP_HOST=postmark + user/pass both = server token
    if not postmark_token and smtp_host and "postmarkapp.com" in smtp_host.lower():
        if smtp_user and smtp_pass and smtp_user == smtp_pass:
            postmark_token = smtp_user
        elif smtp_pass:
            postmark_token = smtp_pass

    use_postmark = provider in ("postmark", "smtp", "postmark-smtp") or bool(
        postmark_token
        or postmark_user.startswith("PM-T-")
        or _env_strip("POSTMARK_SMTP_HOST")
        or (smtp_host and "postmarkapp.com" in smtp_host.lower())
    )

    if use_postmark:
        if postmark_user and postmark_token:
            username, password = postmark_user, postmark_token
        elif postmark_token:
            username = password = postmark_token
        else:
            username, password = postmark_user, postmark_token or smtp_pass
        host = _env_strip("POSTMARK_SMTP_HOST") or smtp_host or "smtp.postmarkapp.com"
        port_raw = _env_strip("POSTMARK_SMTP_PORT") or _env_strip("SMTP_PORT") or "587"
        from_email = (
            _env_strip("POSTMARK_FROM_EMAIL")
            or _env_strip("POSTMARK_SMTP_FROM")
            or _env_strip("SMTP_FROM_EMAIL")
        )
        message_stream = _api_message_stream(postmark_user)
    else:
        username, password = smtp_user, smtp_pass
        host = smtp_host
        port_raw = _env_strip("SMTP_PORT") or "587"
        from_email = _env_strip("SMTP_FROM_EMAIL") or _env_strip("POSTMARK_FROM_EMAIL")
        message_stream = None

    try:
        port = int(port_raw)
    except ValueError:
        port = 587

    has_token = bool(password or postmark_token)
    configured = bool(from_email and has_token and (use_postmark or (host and username)))

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password or postmark_token,
        "postmark_token": password or postmark_token,
        "from_email": from_email,
        "use_postmark": use_postmark,
        "message_stream": message_stream,
        "configured": configured,
    }


def get_email_mode() -> str:
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
    transport = "none"
    if mode == "log":
        transport = "log"
    elif cfg.get("use_postmark") and cfg.get("postmark_token"):
        transport = "postmark_api+smtp"
    elif cfg["configured"]:
        transport = "smtp"
    return {
        "mode": mode,
        "transport": transport,
        "credentials_loaded": bool(cfg.get("postmark_token") or cfg.get("password")),
        "from_email": cfg.get("from_email") or None,
        "smtp_host": cfg.get("host") or None,
        "smtp_ports": list(POSTMARK_PORTS) if cfg.get("use_postmark") else [cfg.get("port")],
        "message_stream": cfg.get("message_stream"),
        "test_redirect": bool(_env_strip("EMAIL_TEST_REDIRECT")),
        "httpx_available": bool(httpx),
    }


def log_email_smtp_startup() -> None:
    st = get_email_delivery_status()
    _log(
        "Email delivery: "
        f"mode={st['mode']} transport={st['transport']} "
        f"host={st['smtp_host'] or '-'} "
        f"ports={st['smtp_ports']} "
        f"credentials_loaded={st['credentials_loaded']} "
        f"from={st['from_email'] or '-'} "
        f"stream={st.get('message_stream') or '-'} "
        f"test_redirect={'yes' if st['test_redirect'] else 'no'}"
    )


def resolve_recipient(to_email: str, subject: str) -> tuple[str, str]:
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


async def _postmark_api_send(
    to_email: str,
    subject: str,
    html_content: str,
    plain: str,
    cfg: dict[str, Any],
) -> tuple[bool, str | None]:
    """Postmark REST API — works on Render without outbound SMTP ports."""
    token = (cfg.get("postmark_token") or cfg.get("password") or "").strip()
    from_email = (cfg.get("from_email") or "").strip()
    if not token:
        return False, "Postmark server token missing"
    if not from_email:
        return False, "From email missing (set SMTP_FROM_EMAIL or POSTMARK_FROM_EMAIL)"
    if not httpx:
        return False, "httpx not installed"

    payload: dict[str, Any] = {
        "From": from_email,
        "To": to_email,
        "Subject": subject,
        "HtmlBody": html_content,
        "TextBody": plain,
    }
    stream = cfg.get("message_stream")
    if stream:
        payload["MessageStream"] = stream

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                POSTMARK_API_URL,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "X-Postmark-Server-Token": token,
                },
                json=payload,
            )
        if resp.status_code == 200:
            _log(f"Postmark API OK -> {to_email}")
            return True, None
        err_body = resp.text[:500]
        try:
            j = resp.json()
            err_body = j.get("Message") or j.get("ErrorCode") or err_body
        except Exception:
            pass
        msg = f"Postmark API HTTP {resp.status_code}: {err_body}"
        _log(msg)
        return False, msg
    except Exception as e:
        msg = f"Postmark API error: {e}"
        _log(msg)
        return False, msg


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

    cfg = _resolve_smtp_config()

    if not cfg["configured"]:
        missing = []
        if not (cfg.get("postmark_token") or cfg.get("password")):
            missing.append("POSTMARK_SMTP_TOKEN (or POSTMARK_SERVER_TOKEN)")
        if not cfg.get("from_email"):
            missing.append("SMTP_FROM_EMAIL or POSTMARK_FROM_EMAIL")
        _last_email_error = (
            "Email not configured on server — set Postmark token + verified from address in Render env. "
            f"Missing: {', '.join(missing)}"
        )
        _log(_last_email_error)
        return False, _last_email_error

    # Postmark HTTP API first (recommended for Render/production)
    if cfg.get("use_postmark") and cfg.get("postmark_token"):
        ok, err = await _postmark_api_send(to_email, subject, html_content, plain, cfg)
        if ok:
            return True, None
        _last_email_error = err
        _log(f"Postmark API failed, trying SMTP fallback: {err}")

    if not _prefer_smtp_over_sendgrid():
        sg_key = _env_strip("SENDGRID_API_KEY")
        sg_from = _env_strip("SENDGRID_FROM_EMAIL") or cfg["from_email"]
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

    if not cfg.get("host") or not cfg.get("username"):
        return False, _last_email_error or "SMTP not available after API failure"

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
        api_hint = _last_email_error or ""
        _last_email_error = f"SMTP error ({cfg['host']}): {e}"
        if api_hint:
            _last_email_error = f"{api_hint} | {_last_email_error}"
        _log(_last_email_error)
        return False, _last_email_error
