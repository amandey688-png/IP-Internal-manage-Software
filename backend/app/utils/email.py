"""
Async email sender.
- SendGrid HTTP API: set SENDGRID_API_KEY + SENDGRID_FROM_EMAIL (works on Render without SMTP ports).
- SMTP: Postmark, Brevo, Gmail, etc. (SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL).

Supported SMTP ports (via SMTP_PORT env):
  587  - default, STARTTLS
  2525 - alternative when 587 blocked
  25   - traditional SMTP, STARTTLS
  465  - SSL from start
"""
import os

try:
    import httpx
except ImportError:
    httpx = None


async def send_email(to_email: str, subject: str, html_content: str, plain_fallback: str | None = None):
    """
    Send an email with HTML content.
    Order: SendGrid API -> SMTP.
    Returns True if sent, False otherwise.
    """
    to_email = (to_email or "").strip()
    if not to_email:
        return False

    plain = (plain_fallback or "This email requires HTML support.").strip()

    # 1. SendGrid HTTP API - works on Render
    sg_key = (os.getenv("SENDGRID_API_KEY") or "").strip()
    sg_from = (os.getenv("SENDGRID_FROM_EMAIL") or os.getenv("SMTP_FROM_EMAIL") or "").strip()
    sg_name = (os.getenv("SENDGRID_FROM_NAME") or "IP Internal Management").strip()
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
                    return True
                _log(f"SendGrid API error: {resp.status_code} {resp.text[:200]}")
        except Exception as e:
            _log(f"SendGrid API error: {e}")
        return False

    # 2. SMTP (Postmark, Brevo, Gmail, etc.)
    import aiosmtplib
    from email.message import EmailMessage

    postmark_token = (os.getenv("POSTMARK_SERVER_TOKEN") or "").strip()
    smtp_host = (os.getenv("SMTP_HOST") or ("smtp.postmarkapp.com" if postmark_token else "")).strip()
    smtp_port = int(os.getenv("SMTP_PORT") or "587")
    smtp_user = (os.getenv("SMTP_USER") or postmark_token).strip()
    smtp_pass = (os.getenv("SMTP_PASSWORD") or os.getenv("SMTP_PASS") or postmark_token).strip()
    smtp_from = (os.getenv("SMTP_FROM_EMAIL") or os.getenv("POSTMARK_FROM_EMAIL") or "").strip()

    if not all([smtp_host, smtp_user, smtp_pass, smtp_from]):
        missing = [
            name
            for name, val in (
                ("SMTP_HOST", smtp_host),
                ("SMTP_USER", smtp_user),
                ("SMTP_PASSWORD or SMTP_PASS", smtp_pass),
                ("SMTP_FROM_EMAIL", smtp_from),
            )
            if not val
        ]
        _log(
            "send_email: no SendGrid key; SMTP incomplete — missing: "
            + ", ".join(missing)
            + ". Save backend/.env and restart."
        )
        return False

    message = EmailMessage()
    message["From"] = smtp_from
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(plain)
    message.add_alternative(html_content, subtype="html")

    # Port 465 = SSL from start; 587, 2525, 25 = STARTTLS
    use_tls = smtp_port == 465
    start_tls = smtp_port in (587, 2525, 25) if not use_tls else False

    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_pass,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        return True
    except Exception as e:
        import sys
        safe_msg = str(e).encode("ascii", errors="replace").decode("ascii")
        print(f"send_email SMTP error: {safe_msg}", file=sys.stderr, flush=True)
        return False


def _log(msg: str):
    import sys
    print(f"[email] {msg}", file=sys.stderr, flush=True)
